package quotes

import (
	"database/sql"
	"fmt"
	"os"
	"sync"
	"testing"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"pika.software.net.co/backend/internal/platform/database"
)

// FASE 6 — Código de cotización (COT-<año>-NNN) generado en el servidor.
//
// Corren contra la base de desarrollo compartida (RUN_DB_TESTS=1), por eso
// cada test usa una empresa única y limpia también document_sequences.

func openTestDB(t *testing.T) *sql.DB {
	t.Helper()
	if os.Getenv("RUN_DB_TESTS") == "" {
		t.Skip("set RUN_DB_TESTS=1 to run database integration tests")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:postgres@127.0.0.1:5432/alfa?sslmode=disable"
	}

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}
	if err := db.Ping(); err != nil {
		db.Close()
		t.Fatalf("ping test database: %v", err)
	}
	if err := database.Migrate(db); err != nil {
		db.Close()
		t.Fatalf("migrate test database: %v", err)
	}
	t.Cleanup(func() { db.Close() })
	return db
}

func testConsecutivesCompany(t *testing.T, db *sql.DB) string {
	t.Helper()
	companyID := fmt.Sprintf("qa-qt-consec-%d", time.Now().UnixNano())
	t.Cleanup(func() {
		db.Exec(`DELETE FROM crm_quotes WHERE company_id = $1`, companyID)
		db.Exec(`DELETE FROM document_sequences WHERE company_id = $1`, companyID)
	})
	return companyID
}

// sampleQuote es la cotización mínima válida: prospecto + estado borrador.
// Sin purchase order ni decisión aceptada, así el upsert no dispara el
// workflow de clientes/equipos.
func sampleQuote() Quote {
	return Quote{
		Prospecto: "Prospecto QA",
		Estado:    "Borrador",
	}
}

func TestCreateQuoteAutoCode(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testConsecutivesCompany(t, db)

	year := fmt.Sprintf("%d", time.Now().UTC().Year())

	first, err := s.UpsertQuote(companyID, sampleQuote())
	if err != nil {
		t.Fatalf("UpsertQuote #1: %v", err)
	}
	if first.Codigo != "COT-"+year+"-001" {
		t.Errorf("primer código = %q, esperado COT-%s-001", first.Codigo, year)
	}

	second, err := s.UpsertQuote(companyID, sampleQuote())
	if err != nil {
		t.Fatalf("UpsertQuote #2: %v", err)
	}
	if second.Codigo != "COT-"+year+"-002" {
		t.Errorf("segundo código = %q, esperado COT-%s-002", second.Codigo, year)
	}
}

func TestPeekQuoteCodeNonConsuming(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testConsecutivesCompany(t, db)

	year := fmt.Sprintf("%d", time.Now().UTC().Year())

	first, err := s.PeekQuoteCode(companyID, "")
	if err != nil {
		t.Fatalf("PeekQuoteCode: %v", err)
	}
	if first != "COT-"+year+"-001" {
		t.Errorf("primer peek = %q, esperado COT-%s-001", first, year)
	}

	// El peek no consume: una segunda llamada devuelve el mismo código.
	again, err := s.PeekQuoteCode(companyID, "")
	if err != nil {
		t.Fatalf("PeekQuoteCode (2da): %v", err)
	}
	if again != first {
		t.Errorf("el peek está consumiendo: primera %q, segunda %q", first, again)
	}

	// La creación real consume el código que el peek prometió.
	created, err := s.UpsertQuote(companyID, sampleQuote())
	if err != nil {
		t.Fatalf("UpsertQuote tras peek: %v", err)
	}
	if created.Codigo != first {
		t.Errorf("código creado = %q, el peek prometió %q", created.Codigo, first)
	}

	// Y el siguiente peek avanza.
	next, err := s.PeekQuoteCode(companyID, "")
	if err != nil {
		t.Fatalf("PeekQuoteCode (3ra): %v", err)
	}
	if next != "COT-"+year+"-002" {
		t.Errorf("peek tras creación = %q, esperado COT-%s-002", next, year)
	}
}

func TestCreateQuoteConcurrentDistinct(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testConsecutivesCompany(t, db)

	const workers = 8
	results := make([]string, workers)
	var wg sync.WaitGroup
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			quote, err := s.UpsertQuote(companyID, sampleQuote())
			if err != nil {
				t.Errorf("UpsertQuote #%d: %v", idx, err)
				return
			}
			results[idx] = quote.Codigo
		}(i)
	}
	wg.Wait()

	seen := map[string]bool{}
	for _, code := range results {
		if seen[code] {
			t.Errorf("código duplicado %q en creaciones concurrentes: %v", code, results)
			return
		}
		seen[code] = true
	}
}
