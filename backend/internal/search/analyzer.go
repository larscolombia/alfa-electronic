package search

import (
	"strings"
	"unicode"
)

// foldRune normalizes accented Latin characters to their ASCII base form so that
// searches are diacritic-insensitive (e.g. "Bogotá" matches "bogota").
func foldRune(r rune) rune {
	switch r {
	case 'á', 'à', 'ä', 'â', 'ã', 'å', 'ā':
		return 'a'
	case 'é', 'è', 'ë', 'ê', 'ē':
		return 'e'
	case 'í', 'ì', 'ï', 'î', 'ī':
		return 'i'
	case 'ó', 'ò', 'ö', 'ô', 'õ', 'ō':
		return 'o'
	case 'ú', 'ù', 'ü', 'û', 'ū':
		return 'u'
	case 'ñ':
		return 'n'
	case 'ç':
		return 'c'
	default:
		return r
	}
}

// analyze tokenizes free text into normalized search terms. The pipeline lowercases,
// folds accents, splits on any non-alphanumeric rune and discards single-character
// tokens. It is the shared analyzer used both for indexing documents and parsing queries,
// guaranteeing that the same normalization is applied on both sides.
func analyze(text string) []string {
	if text == "" {
		return nil
	}

	var b strings.Builder
	b.Grow(len(text))
	for _, r := range strings.ToLower(text) {
		r = foldRune(r)
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(r)
		} else {
			b.WriteByte(' ')
		}
	}

	fields := strings.Fields(b.String())
	terms := make([]string, 0, len(fields))
	for _, f := range fields {
		if len(f) < 2 {
			continue
		}
		terms = append(terms, f)
	}
	return terms
}
