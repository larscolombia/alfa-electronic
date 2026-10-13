package quotes

import (
	"context"
	"fmt"
	"strings"
)

func (s *Service) ListQuotes(companyID string, query ListQuotesQuery) ([]Quote, error) {
	ctx := context.Background()
	filters := []string{"company_id = $1", "soft_delete = false"}
	args := []any{companyID}
	nextArg := 2

	if status := strings.TrimSpace(query.Status); status != "" {
		normalizedStatus, err := normalizeQuoteStatus(status)
		if err != nil {
			return nil, err
		}
		filters = append(filters, fmt.Sprintf("estado = $%d", nextArg))
		args = append(args, normalizedStatus)
		nextArg++
	}

	limit := query.Limit
	if limit < 0 {
		return nil, errListLimitInvalid
	}
	if limit > maxQuotesListLimit {
		limit = maxQuotesListLimit
	}

	statement := buildListQuotesStatement(filters, 0)
	if limit > 0 {
		statement = buildListQuotesStatement(filters, nextArg)
		args = append(args, limit)
	}

	rows, err := s.db.QueryContext(ctx, statement, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Quote, 0)
	for rows.Next() {
		item, scanErr := scanQuote(rows)
		if scanErr != nil {
			return nil, scanErr
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (s *Service) GetQuote(companyID, quoteID string) (Quote, error) {
	ctx := context.Background()
	normalizedID := strings.TrimSpace(quoteID)
	if normalizedID == "" {
		return Quote{}, errQuoteIDRequired
	}

	row := s.db.QueryRowContext(ctx, buildGetQuoteStatement("id"), companyID, normalizedID)

	item, err := scanQuote(row)
	if err != nil {
		return Quote{}, err
	}

	return item, nil
}

func (s *Service) GetQuoteByToken(companyID, token string) (Quote, error) {
	ctx := context.Background()
	normalizedToken := strings.TrimSpace(token)
	if normalizedToken == "" {
		return Quote{}, errQuoteTokenRequired
	}

	row := s.db.QueryRowContext(ctx, buildGetQuoteStatement("token"), companyID, normalizedToken)

	item, err := scanQuote(row)
	if err != nil {
		return Quote{}, err
	}

	return item, nil
}
