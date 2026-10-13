package security

import (
	"fmt"
	"net"
	"strings"
)

func normalizeSubject(subjectTypeRaw, subjectValueRaw string) (string, string, error) {
	subjectType := strings.ToLower(strings.TrimSpace(subjectTypeRaw))
	if subjectType != SubjectTypeUser && subjectType != SubjectTypeRole {
		return "", "", errSubjectTypeInvalid
	}

	subjectValue := strings.ToLower(strings.TrimSpace(subjectValueRaw))
	if subjectValue == "" {
		return "", "", errSubjectValueRequired
	}

	return subjectType, subjectValue, nil
}

func normalizeRole(raw string) (string, error) {
	role := strings.ToLower(strings.TrimSpace(raw))
	if role == "" {
		return "", errRoleRequired
	}

	if _, ok := allowedRoles[role]; !ok {
		return "", errRoleInvalid
	}

	return role, nil
}

func normalizeIPTokens(tokens []string) ([]string, error) {
	normalized := make([]string, 0, len(tokens))
	for _, token := range tokens {
		value := strings.TrimSpace(token)
		if value == "" {
			continue
		}

		parsed, ok := normalizeIPToken(value)
		if !ok {
			return nil, fmt.Errorf("%w: %s", errInvalidIPToken, value)
		}

		normalized = appendIfMissing(normalized, parsed)
	}

	return normalized, nil
}

func normalizeMACTokens(tokens []string) ([]string, error) {
	normalized := make([]string, 0, len(tokens))
	for _, token := range tokens {
		value := strings.TrimSpace(token)
		if value == "" {
			continue
		}

		parsed, ok := normalizeMACToken(value)
		if !ok {
			return nil, fmt.Errorf("%w: %s", errInvalidMACToken, value)
		}

		normalized = appendIfMissing(normalized, parsed)
	}

	return normalized, nil
}

func normalizeIPToken(token string) (string, bool) {
	trimmed := strings.TrimSpace(token)
	if trimmed == "" {
		return "", false
	}

	if strings.Contains(trimmed, "/") {
		_, network, err := net.ParseCIDR(trimmed)
		if err != nil || network == nil {
			return "", false
		}
		return network.String(), true
	}

	ip, ok := normalizeIPLiteral(trimmed)
	if !ok {
		return "", false
	}
	return ip, true
}

func normalizeIPLiteral(raw string) (string, bool) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return "", false
	}

	ip := net.ParseIP(trimmed)
	if ip == nil {
		return "", false
	}

	if ipv4 := ip.To4(); ipv4 != nil {
		return ipv4.String(), true
	}

	return ip.String(), true
}

func ipMatchesToken(sourceIP, token string) bool {
	normalizedSource, ok := normalizeIPLiteral(sourceIP)
	if !ok {
		return false
	}

	trimmedToken := strings.TrimSpace(token)
	if trimmedToken == "" {
		return false
	}

	if strings.Contains(trimmedToken, "/") {
		ip := net.ParseIP(normalizedSource)
		if ip == nil {
			return false
		}

		_, network, err := net.ParseCIDR(trimmedToken)
		if err != nil || network == nil {
			return false
		}

		return network.Contains(ip)
	}

	normalizedToken, ok := normalizeIPLiteral(trimmedToken)
	if !ok {
		return false
	}

	return normalizedToken == normalizedSource
}

func normalizeMACToken(token string) (string, bool) {
	hardwareAddr, err := net.ParseMAC(strings.TrimSpace(token))
	if err != nil {
		return "", false
	}

	upper := strings.ToUpper(hardwareAddr.String())
	return upper, true
}

func appendIfMissing(items []string, candidate string) []string {
	for _, current := range items {
		if current == candidate {
			return items
		}
	}
	return append(items, candidate)
}
