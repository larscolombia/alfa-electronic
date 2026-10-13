package finance

import "strings"

func normalizeAccountPayload(input UpsertAccountRequest) (UpsertAccountRequest, error) {
	normalized := input
	normalized.AccountType = normalizeAccountType(normalized.AccountType)
	normalized.BankName = strings.TrimSpace(normalized.BankName)
	normalized.HolderName = strings.TrimSpace(normalized.HolderName)
	normalized.AccountNumber = strings.TrimSpace(normalized.AccountNumber)
	normalized.ProductType = normalizeAccountProductType(normalized.ProductType)
	normalized.CurrencyCode = normalizeCurrencyCode(normalized.CurrencyCode)
	normalized.ContactNumber = strings.TrimSpace(normalized.ContactNumber)
	normalized.Status = normalizeAccountStatus(normalized.Status)
	normalized.LogoFileName = strings.TrimSpace(normalized.LogoFileName)

	if normalized.AccountType == "" {
		return UpsertAccountRequest{}, errAccountTypeInvalid
	}
	if normalized.AccountType == string(AccountTypeBank) && normalized.BankName == "" {
		return UpsertAccountRequest{}, errAccountBankNameRequired
	}
	if normalized.HolderName == "" {
		return UpsertAccountRequest{}, errAccountHolderNameRequired
	}
	if normalized.AccountNumber == "" {
		return UpsertAccountRequest{}, errAccountNumberRequired
	}
	if normalized.ProductType == "" {
		return UpsertAccountRequest{}, errAccountProductTypeInvalid
	}
	if normalized.CurrencyCode == "" {
		return UpsertAccountRequest{}, errAccountCurrencyInvalid
	}
	if normalized.InitialBalance < 0 {
		return UpsertAccountRequest{}, errAccountBalanceInvalid
	}
	if normalized.Status == "" {
		return UpsertAccountRequest{}, errAccountStatusInvalid
	}

	if normalized.AccountType == string(AccountTypeCash) && normalized.BankName == "" {
		normalized.BankName = "Caja de efectivo"
	}

	return normalized, nil
}

func normalizeAccountType(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "banco":
		return string(AccountTypeBank)
	case "efectivo":
		return string(AccountTypeCash)
	default:
		return ""
	}
}

func normalizeAccountProductType(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "ahorros":
		return string(AccountProductSavings)
	case "corriente":
		return string(AccountProductChecking)
	case "caja menor", "caja-menor", "cajamenor":
		return string(AccountProductPettyCash)
	default:
		return ""
	}
}

func normalizeCurrencyCode(value string) string {
	switch strings.ToUpper(strings.TrimSpace(value)) {
	case "COP", "USD", "EUR":
		return strings.ToUpper(strings.TrimSpace(value))
	default:
		return ""
	}
}

func normalizeAccountStatus(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "activa":
		return string(AccountStatusActive)
	case "inactiva":
		return string(AccountStatusInactive)
	default:
		return ""
	}
}
