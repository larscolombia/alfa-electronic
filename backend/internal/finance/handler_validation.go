package finance

import "errors"

func isPaymentValidationError(err error) bool {
	return errors.Is(err, errPaymentInvoiceRequired) ||
		errors.Is(err, errPaymentDateInvalid) ||
		errors.Is(err, errPaymentAmountInvalid) ||
		errors.Is(err, errPaymentStatusInvalid) ||
		errors.Is(err, errPaymentCurrencyInvalid) ||
		errors.Is(err, errPaymentExchangeInvalid) ||
		errors.Is(err, errPaymentRetentionInvalid)
}

func isInvoiceValidationError(err error) bool {
	return errors.Is(err, errInvoiceClientRequired) ||
		errors.Is(err, errInvoiceSequenceInvalid) ||
		errors.Is(err, errInvoiceDateInvalid) ||
		errors.Is(err, errInvoiceDueDateInvalid) ||
		errors.Is(err, errInvoiceCurrencyInvalid) ||
		errors.Is(err, errInvoiceExchangeInvalid) ||
		errors.Is(err, errInvoiceDiscountInvalid) ||
		errors.Is(err, errInvoiceDiscountModeInvalid) ||
		errors.Is(err, errInvoiceTaxCalcInvalid) ||
		errors.Is(err, errInvoicePaymentInvalid) ||
		errors.Is(err, errInvoiceSourceInvalid) ||
		errors.Is(err, errInvoiceStatusInvalid) ||
		errors.Is(err, errInvoiceItemsRequired) ||
		errors.Is(err, errInvoiceItemAmountInvalid)
}

func isRecurringValidationError(err error) bool {
	return errors.Is(err, errRecurringClientRequired) ||
		errors.Is(err, errRecurringStatusInvalid) ||
		errors.Is(err, errRecurringCurrencyInvalid) ||
		errors.Is(err, errRecurringTaxCalcInvalid) ||
		errors.Is(err, errRecurringDiscountInvalid) ||
		errors.Is(err, errRecurringDiscountMode) ||
		errors.Is(err, errRecurringFrequencyInvalid) ||
		errors.Is(err, errRecurringDateInvalid) ||
		errors.Is(err, errRecurringNextDateInvalid) ||
		errors.Is(err, errRecurringCyclesInvalid) ||
		errors.Is(err, errRecurringItemsRequired) ||
		errors.Is(err, errRecurringItemAmountInvalid)
}
