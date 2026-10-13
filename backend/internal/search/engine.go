package search

import (
	"hash/fnv"
	"math"
	"sort"
	"strings"
	"sync"
	"sync/atomic"
)

// BM25 ranking parameters (Okapi BM25, the same family Elasticsearch/Lucene use by default).
const (
	bm25K1 = 1.2
	bm25B  = 0.75

	// prefixWeight scales the contribution of prefix (typeahead) matches relative to
	// exact term matches so partial words still surface results without overpowering
	// full matches.
	prefixWeight = 0.45

	// fuzzy match weights for typo tolerance, by Levenshtein edit distance (1 or 2 edits).
	fuzzyWeight1 = 0.40
	fuzzyWeight2 = 0.22
)

// Document is a single indexable record.
type Document struct {
	ID        string
	Type      string
	CompanyID string
	Title     string
	Body      string
	Fields    map[string]string
}

// Hit is a scored search result.
type Hit struct {
	Document Document
	Score    float64
}

// posting is an entry in an inverted index list: it links a term to a document and
// stores the term frequency inside that document (used by BM25).
type posting struct {
	docID string
	tf    int
}

// shard holds one slice of an index: an inverted index (term -> postings) plus the
// stored documents and per-document length statistics needed for BM25. Every shard is
// independently lockable so reads and writes scale across goroutines.
type shard struct {
	mu       sync.RWMutex
	docs     map[string]Document
	docLen   map[string]int
	inverted map[string][]posting
	totalLen int64
}

func newShard() *shard {
	return &shard{
		docs:     make(map[string]Document),
		docLen:   make(map[string]int),
		inverted: make(map[string][]posting),
	}
}

func (s *shard) indexDoc(doc Document, terms []string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.removeLocked(doc.ID)

	freq := make(map[string]int, len(terms))
	for _, t := range terms {
		freq[t]++
	}

	s.docs[doc.ID] = doc
	s.docLen[doc.ID] = len(terms)
	s.totalLen += int64(len(terms))
	for term, f := range freq {
		s.inverted[term] = append(s.inverted[term], posting{docID: doc.ID, tf: f})
	}
}

func (s *shard) delete(docID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.removeLocked(docID)
}

func (s *shard) deleteByCompany(companyID string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	ids := make([]string, 0)
	for id, doc := range s.docs {
		if doc.CompanyID == companyID {
			ids = append(ids, id)
		}
	}
	for _, id := range ids {
		s.removeLocked(id)
	}
}

// removeLocked deletes a document from the shard. It re-derives the document's terms from
// its stored text so only the affected postings lists are touched. Caller must hold the lock.
func (s *shard) removeLocked(docID string) {
	doc, ok := s.docs[docID]
	if !ok {
		return
	}

	seen := make(map[string]struct{})
	for _, term := range analyze(doc.Title + " " + doc.Body) {
		if _, done := seen[term]; done {
			continue
		}
		seen[term] = struct{}{}

		postings := s.inverted[term]
		filtered := postings[:0]
		for _, p := range postings {
			if p.docID != docID {
				filtered = append(filtered, p)
			}
		}
		if len(filtered) == 0 {
			delete(s.inverted, term)
		} else {
			s.inverted[term] = filtered
		}
	}

	s.totalLen -= int64(s.docLen[docID])
	delete(s.docLen, docID)
	delete(s.docs, docID)
}

// search executes a BM25 ranked query against this shard and returns scored hits. Exact
// term matches are scored at full weight; terms in the vocabulary that begin with a query
// term contribute a reduced weight to support typeahead. The whole computation runs under a
// single read-lock so the returned document copies are always consistent.
func (s *shard) search(terms []string, companyID string) []Hit {
	s.mu.RLock()
	defer s.mu.RUnlock()

	n := len(s.docs)
	if n == 0 {
		return nil
	}

	avgdl := 1.0
	if s.totalLen > 0 {
		avgdl = float64(s.totalLen) / float64(n)
	}

	scores := make(map[string]float64)

	accumulate := func(term string, weight float64) {
		postings, ok := s.inverted[term]
		if !ok {
			return
		}
		df := len(postings)
		idf := math.Log(1 + (float64(n)-float64(df)+0.5)/(float64(df)+0.5))
		for _, p := range postings {
			doc := s.docs[p.docID]
			if companyID != "" && doc.CompanyID != "" && doc.CompanyID != companyID {
				continue
			}
			dl := float64(s.docLen[p.docID])
			tf := float64(p.tf)
			bm := idf * (tf * (bm25K1 + 1)) / (tf + bm25K1*(1-bm25B+bm25B*dl/avgdl))
			scores[p.docID] += bm * weight
		}
	}

	exact := make(map[string]struct{}, len(terms))
	for _, term := range terms {
		exact[term] = struct{}{}
		accumulate(term, 1.0)
	}

	// Approximate matching: a single pass over the shard vocabulary. For each query term we
	// reward (a) vocabulary terms that start with it (typeahead) and (b) vocabulary terms
	// within an automatic edit-distance budget (fuzzy / typo tolerance, like Elasticsearch's
	// fuzziness=AUTO). This is what lets "marivel" or "maribl" still find "maribel".
	for _, qt := range terms {
		maxDist := autoFuzziness(qt)
		for term := range s.inverted {
			if _, isExact := exact[term]; isExact {
				continue
			}
			if strings.HasPrefix(term, qt) {
				accumulate(term, prefixWeight)
				continue
			}
			if maxDist == 0 {
				continue
			}
			// Cheap length-difference prune before the more expensive edit-distance check.
			if abs(len(term)-len(qt)) > maxDist {
				continue
			}
			switch levenshteinWithin(qt, term, maxDist) {
			case 1:
				accumulate(term, fuzzyWeight1)
			case 2:
				accumulate(term, fuzzyWeight2)
			}
		}
	}

	hits := make([]Hit, 0, len(scores))
	for id, sc := range scores {
		hits = append(hits, Hit{Document: s.docs[id], Score: sc})
	}
	return hits
}

// autoFuzziness mirrors Elasticsearch's fuzziness=AUTO: short terms must match exactly,
// medium terms tolerate one edit, longer terms tolerate two.
func autoFuzziness(term string) int {
	switch n := len([]rune(term)); {
	case n <= 2:
		return 0
	case n <= 5:
		return 1
	default:
		return 2
	}
}

// levenshteinWithin returns the Levenshtein edit distance between a and b, capped at maxDist.
// If the true distance exceeds maxDist it returns maxDist+1 and stops early. Uses a rolling
// two-row matrix with a per-row lower-bound prune for speed.
func levenshteinWithin(a, b string, maxDist int) int {
	ra := []rune(a)
	rb := []rune(b)
	la, lb := len(ra), len(rb)
	if la == 0 {
		if lb <= maxDist {
			return lb
		}
		return maxDist + 1
	}
	if lb == 0 {
		if la <= maxDist {
			return la
		}
		return maxDist + 1
	}

	prev := make([]int, lb+1)
	curr := make([]int, lb+1)
	for j := 0; j <= lb; j++ {
		prev[j] = j
	}

	for i := 1; i <= la; i++ {
		curr[0] = i
		rowMin := curr[0]
		for j := 1; j <= lb; j++ {
			cost := 1
			if ra[i-1] == rb[j-1] {
				cost = 0
			}
			del := prev[j] + 1
			ins := curr[j-1] + 1
			sub := prev[j-1] + cost
			m := del
			if ins < m {
				m = ins
			}
			if sub < m {
				m = sub
			}
			curr[j] = m
			if m < rowMin {
				rowMin = m
			}
		}
		if rowMin > maxDist {
			return maxDist + 1
		}
		prev, curr = curr, prev
	}

	if prev[lb] > maxDist {
		return maxDist + 1
	}
	return prev[lb]
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

// Index is a named, sharded, replicated collection of documents. Documents are routed to a
// primary shard by a hash of their ID; each primary can have N replica copies. Replicas hold
// identical data and are used to spread read load (queries round-robin between primary and
// replicas), mirroring Elasticsearch primary/replica semantics.
type Index struct {
	name         string
	shardCount   int
	replicaCount int
	primaries    []*shard
	replicas     [][]*shard
	rr           uint64
}

func newIndex(name string, shardCount, replicaCount int) *Index {
	if shardCount < 1 {
		shardCount = 1
	}
	if replicaCount < 0 {
		replicaCount = 0
	}

	idx := &Index{
		name:         name,
		shardCount:   shardCount,
		replicaCount: replicaCount,
		primaries:    make([]*shard, shardCount),
		replicas:     make([][]*shard, shardCount),
	}
	for i := 0; i < shardCount; i++ {
		idx.primaries[i] = newShard()
		idx.replicas[i] = make([]*shard, replicaCount)
		for r := 0; r < replicaCount; r++ {
			idx.replicas[i][r] = newShard()
		}
	}
	return idx
}

func (idx *Index) route(docID string) int {
	h := fnv.New32a()
	_, _ = h.Write([]byte(docID))
	return int(h.Sum32() % uint32(idx.shardCount))
}

func (idx *Index) indexDoc(doc Document) {
	terms := analyze(doc.Title + " " + doc.Body)
	sid := idx.route(doc.ID)
	idx.primaries[sid].indexDoc(doc, terms)
	for _, rep := range idx.replicas[sid] {
		rep.indexDoc(doc, terms)
	}
}

func (idx *Index) deleteDoc(docID string) {
	sid := idx.route(docID)
	idx.primaries[sid].delete(docID)
	for _, rep := range idx.replicas[sid] {
		rep.delete(docID)
	}
}

func (idx *Index) replaceCompanyDocs(companyID string, docs []Document) {
	for i := range idx.primaries {
		idx.primaries[i].deleteByCompany(companyID)
		for _, rep := range idx.replicas[i] {
			rep.deleteByCompany(companyID)
		}
	}
	for _, d := range docs {
		idx.indexDoc(d)
	}
}

// pickReplica selects which physical copy of a shard serves a read, round-robining across
// the primary and its replicas to distribute query load.
func (idx *Index) pickReplica(sid int) *shard {
	if idx.replicaCount == 0 {
		return idx.primaries[sid]
	}
	total := idx.replicaCount + 1
	pick := int(atomic.AddUint64(&idx.rr, 1) % uint64(total))
	if pick == 0 {
		return idx.primaries[sid]
	}
	return idx.replicas[sid][pick-1]
}

// search fans the query out across all shards concurrently (one goroutine per shard),
// then merges and ranks the partial results.
func (idx *Index) search(terms []string, companyID string, limit int) []Hit {
	partials := make([][]Hit, idx.shardCount)
	var wg sync.WaitGroup
	for i := 0; i < idx.shardCount; i++ {
		wg.Add(1)
		go func(sid int) {
			defer wg.Done()
			partials[sid] = idx.pickReplica(sid).search(terms, companyID)
		}(i)
	}
	wg.Wait()

	hits := make([]Hit, 0)
	for _, part := range partials {
		hits = append(hits, part...)
	}
	sortHits(hits)
	if limit > 0 && len(hits) > limit {
		hits = hits[:limit]
	}
	return hits
}

// Engine is the top-level search service holding all named indices.
type Engine struct {
	mu      sync.RWMutex
	indices map[string]*Index
}

func NewEngine() *Engine {
	return &Engine{indices: make(map[string]*Index)}
}

func (e *Engine) CreateIndex(name string, shards, replicas int) {
	e.mu.Lock()
	defer e.mu.Unlock()
	if _, ok := e.indices[name]; !ok {
		e.indices[name] = newIndex(name, shards, replicas)
	}
}

func (e *Engine) getIndex(name string) (*Index, bool) {
	e.mu.RLock()
	defer e.mu.RUnlock()
	idx, ok := e.indices[name]
	return idx, ok
}

// RebuildIndex atomically replaces an entire index with a freshly built one. Readers always
// observe either the complete old index or the complete new one, never a partial state.
func (e *Engine) RebuildIndex(name string, shards, replicas int, docs []Document) {
	idx := newIndex(name, shards, replicas)
	for _, d := range docs {
		idx.indexDoc(d)
	}
	e.mu.Lock()
	e.indices[name] = idx
	e.mu.Unlock()
}

func (e *Engine) Index(name string, doc Document) {
	if idx, ok := e.getIndex(name); ok {
		idx.indexDoc(doc)
	}
}

func (e *Engine) Delete(name, docID string) {
	if idx, ok := e.getIndex(name); ok {
		idx.deleteDoc(docID)
	}
}

func (e *Engine) ReplaceCompanyDocs(name, companyID string, docs []Document) {
	if idx, ok := e.getIndex(name); ok {
		idx.replaceCompanyDocs(companyID, docs)
	}
}

// Search queries the requested indices concurrently and returns a single merged, ranked list.
func (e *Engine) Search(indexNames []string, query, companyID string, perIndexLimit int) []Hit {
	terms := analyze(query)
	if len(terms) == 0 {
		return nil
	}

	e.mu.RLock()
	targets := make([]*Index, 0, len(indexNames))
	for _, name := range indexNames {
		if idx, ok := e.indices[name]; ok {
			targets = append(targets, idx)
		}
	}
	e.mu.RUnlock()

	partials := make([][]Hit, len(targets))
	var wg sync.WaitGroup
	for i, idx := range targets {
		wg.Add(1)
		go func(pos int, index *Index) {
			defer wg.Done()
			partials[pos] = index.search(terms, companyID, perIndexLimit)
		}(i, idx)
	}
	wg.Wait()

	merged := make([]Hit, 0)
	for _, part := range partials {
		merged = append(merged, part...)
	}
	sortHits(merged)
	return merged
}

func sortHits(hits []Hit) {
	sort.Slice(hits, func(a, b int) bool {
		if hits[a].Score == hits[b].Score {
			return hits[a].Document.Title < hits[b].Document.Title
		}
		return hits[a].Score > hits[b].Score
	})
}
