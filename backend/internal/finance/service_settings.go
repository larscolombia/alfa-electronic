package finance

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

// GetSetting lee una configuración por empresa. Devuelve found=false cuando no
// existe fila: el frontend aplica su fallback SOLO en ese caso.
func (s *Service) GetSetting(companyID, key string) (CompanySetting, bool, error) {
	ctx := context.Background()
	key = strings.TrimSpace(key)
	if key == "" {
		return CompanySetting{}, false, errSettingKeyRequired
	}

	var setting CompanySetting
	var value []byte
	var updatedAt time.Time
	err := s.db.QueryRowContext(ctx, `
SELECT setting_key, value_json, updated_at
FROM company_settings
WHERE company_id = $1 AND setting_key = $2;
`, companyID, key).Scan(&setting.Key, &value, &updatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return CompanySetting{}, false, nil
		}
		return CompanySetting{}, false, err
	}

	setting.Value = json.RawMessage(value)
	setting.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return setting, true, nil
}

func (s *Service) PutSetting(companyID, key string, value json.RawMessage) (CompanySetting, error) {
	ctx := context.Background()
	key = strings.TrimSpace(key)
	if key == "" {
		return CompanySetting{}, errSettingKeyRequired
	}
	if len(value) == 0 || !json.Valid(value) {
		return CompanySetting{}, errSettingValueRequired
	}

	var stored []byte
	var updatedAt time.Time
	err := s.db.QueryRowContext(ctx, `
INSERT INTO company_settings (company_id, setting_key, value_json, updated_at)
VALUES ($1, $2, $3::jsonb, NOW())
ON CONFLICT (company_id, setting_key)
DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = NOW()
RETURNING value_json, updated_at;
`, companyID, key, []byte(value)).Scan(&stored, &updatedAt)
	if err != nil {
		return CompanySetting{}, err
	}

	return CompanySetting{
		Key:       key,
		Value:     json.RawMessage(stored),
		UpdatedAt: updatedAt.UTC().Format(time.RFC3339),
	}, nil
}
