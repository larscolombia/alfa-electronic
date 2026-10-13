package database

func migrationStatementsAuthFlows() []string {
	return []string{
		`CREATE TABLE IF NOT EXISTS auth_signup_submissions (
			company_id TEXT NOT NULL,
			id TEXT NOT NULL,
			first_name VARCHAR(120) NOT NULL,
			last_name VARCHAR(120) NOT NULL,
			email VARCHAR(180) NOT NULL,
			country_code VARCHAR(12) NOT NULL,
			phone VARCHAR(40) NOT NULL,
			password_hash TEXT NOT NULL,
			signup_type VARCHAR(20) NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY(company_id, id),
			UNIQUE(company_id, email)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_auth_signup_company_created ON auth_signup_submissions(company_id, created_at DESC);`,
		`CREATE TABLE IF NOT EXISTS auth_onboarding_profiles (
			company_id TEXT NOT NULL,
			signup_id TEXT NOT NULL,
			display_name VARCHAR(160) NOT NULL,
			business_domain VARCHAR(80) NOT NULL,
			theme VARCHAR(40) NOT NULL,
			country VARCHAR(120) NOT NULL DEFAULT '',
			summary_acknowledged BOOLEAN NOT NULL DEFAULT false,
			photo_data_url TEXT NOT NULL DEFAULT '',
			completed_at TIMESTAMPTZ NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY(company_id, signup_id),
			FOREIGN KEY(company_id, signup_id) REFERENCES auth_signup_submissions(company_id, id) ON DELETE CASCADE
		);`,
		`CREATE INDEX IF NOT EXISTS idx_auth_onboarding_company_updated ON auth_onboarding_profiles(company_id, updated_at DESC);`,
		`CREATE TABLE IF NOT EXISTS auth_password_reset_tokens (
			company_id TEXT NOT NULL,
			id TEXT NOT NULL,
			signup_id TEXT NOT NULL,
			email VARCHAR(180) NOT NULL,
			token VARCHAR(96) NOT NULL,
			expires_at TIMESTAMPTZ NOT NULL,
			used_at TIMESTAMPTZ NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY(company_id, id),
			UNIQUE(company_id, token),
			FOREIGN KEY(company_id, signup_id) REFERENCES auth_signup_submissions(company_id, id) ON DELETE CASCADE
		);`,
		`CREATE INDEX IF NOT EXISTS idx_auth_reset_company_email_created ON auth_password_reset_tokens(company_id, email, created_at DESC);`,
		`ALTER TABLE security_access_global_rules ADD COLUMN IF NOT EXISTS role VARCHAR(80) NOT NULL DEFAULT '';`,
		`ALTER TABLE security_access_restrictions ADD COLUMN IF NOT EXISTS role VARCHAR(80) NOT NULL DEFAULT '';`,
	}
}
