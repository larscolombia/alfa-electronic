package database

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func Open() (*sql.DB, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("open postgres connection: %w", err)
	}

	db.SetMaxOpenConns(20)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(time.Hour)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("ping postgres: %w (set DATABASE_URL with valid credentials)", err)
	}

	return db, nil
}

// migrateAdvisoryLockKey identifica el lock de serialización de Migrate.
// hashtext es determinista entre sesiones, así todas las conexiones del repo
// compiten por el mismo lock sin un número mágico compartido.
const migrateAdvisoryLockKey = "alfa-migrations"

func Migrate(db *sql.DB) error {
	ctx := context.Background()

	// El lock es de SESIÓN: hay que tomarlo y ejecutar todo el DDL en la MISMA
	// conexión, porque con el pool de *sql.DB cada Exec podría caer en otra.
	// Sin serialización, dos arranques simultáneos (o test binaries) corriendo
	// CREATE TABLE IF NOT EXISTS a la vez chocan en pg_type con "duplicate key"
	// aunque la sentencia sea idempotente: ambas pasan el chequeo de existencia
	// antes de que ninguna inserte el tipo compuesto de la tabla.
	conn, err := db.Conn(ctx)
	if err != nil {
		return fmt.Errorf("migrate connection: %w", err)
	}
	defer conn.Close()

	if _, err := conn.ExecContext(ctx, `SELECT pg_advisory_lock(hashtext('`+migrateAdvisoryLockKey+`'))`); err != nil {
		return fmt.Errorf("migrate advisory lock: %w", err)
	}
	defer func() {
		_, _ = conn.ExecContext(context.Background(), `SELECT pg_advisory_unlock(hashtext('`+migrateAdvisoryLockKey+`'))`)
	}()

	statements := migrationStatements()

	for idx, statement := range statements {
		if _, err := conn.ExecContext(ctx, statement); err != nil {
			return fmt.Errorf("migrate statement %d: %w", idx+1, err)
		}
	}

	return nil
}
