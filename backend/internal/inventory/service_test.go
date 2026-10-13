package inventory

import (
	"testing"
	"time"
)

func fixedTime() time.Time {
	return time.Date(2026, 8, 5, 12, 0, 0, 0, time.UTC)
}

func TestNormalizeToken(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"LM324N", "lm324n"},
		{"  ACS355  ", "acs355"},
		{"MT8071IE", "mt8071ie"},
		{"Resistor 10K", "resistor10k"},
		{"Café Latte", "cafélatte"},
		{"", ""},
	}

	for _, tt := range tests {
		result := normalizeToken(tt.input)
		if result != tt.expected {
			t.Errorf("normalizeToken(%q) = %q, want %q", tt.input, result, tt.expected)
		}
	}
}

func TestSimilarity(t *testing.T) {
	tests := []struct {
		left     string
		right    string
		expected float64
	}{
		{"lm324n", "lm324n", 1.0},
		{"lm324n", "lm324", 0.83},
		{"abc", "xyz", 0},
		{"", "abc", 0},
		{"abc", "", 0},
		{"", "", 0},
	}

	for _, tt := range tests {
		result := similarity(tt.left, tt.right)
		if tt.expected == 0 && result != 0 {
			t.Errorf("similarity(%q, %q) = %f, want 0", tt.left, tt.right, result)
		}
		if tt.expected == 1.0 && result != 1.0 {
			t.Errorf("similarity(%q, %q) = %f, want 1.0", tt.left, tt.right, result)
		}
	}
}

func TestLevenshteinDistance(t *testing.T) {
	tests := []struct {
		left     string
		right    string
		expected int
	}{
		{"kitten", "sitting", 3},
		{"", "abc", 3},
		{"abc", "", 3},
		{"abc", "abc", 0},
		{"abc", "abd", 1},
	}

	for _, tt := range tests {
		result := levenshtein(tt.left, tt.right)
		if result != tt.expected {
			t.Errorf("levenshtein(%q, %q) = %d, want %d", tt.left, tt.right, result, tt.expected)
		}
	}
}

func TestFormatSupplierLabel(t *testing.T) {
	tests := []struct {
		code     string
		name     string
		expected string
	}{
		{"DGK", "DigiKey", "DGK - DigiKey"},
		{"DGK", "", "DGK"},
		{"", "DigiKey", "DigiKey"},
		{"", "", ""},
		{"  DGK  ", "  DigiKey  ", "DGK - DigiKey"},
	}

	for _, tt := range tests {
		result := formatSupplierLabel(tt.code, tt.name)
		if result != tt.expected {
			t.Errorf("formatSupplierLabel(%q, %q) = %q, want %q", tt.code, tt.name, result, tt.expected)
		}
	}
}

func TestGenerateInternalCode(t *testing.T) {
	tests := []struct {
		family   string
		count    int
		expected string
	}{
		{"Circuito integrado", 1, "INV-CIR-00002"},
		{"Resistencias", 5, "INV-RES-00006"},
		{"Sin familia", 0, "INV-SIN-00001"},
		{"AB", 10, "INV-AB-00011"},
	}

	for _, tt := range tests {
		result := generateInternalCode(tt.family, tt.count)
		if result != tt.expected {
			t.Errorf("generateInternalCode(%q, %d) = %q, want %q", tt.family, tt.count, result, tt.expected)
		}
	}
}

func TestMaxInt(t *testing.T) {
	tests := []struct {
		a, b     int
		expected int
	}{
		{1, 2, 2},
		{5, 3, 5},
		{0, 0, 0},
		{-1, 1, 1},
	}

	for _, tt := range tests {
		result := maxInt(tt.a, tt.b)
		if result != tt.expected {
			t.Errorf("maxInt(%d, %d) = %d, want %d", tt.a, tt.b, result, tt.expected)
		}
	}
}

func TestIsoWeekKey(t *testing.T) {
	// Just verify it returns a non-empty string in the right format
	result := isoWeekKey(fixedTime())
	if len(result) == 0 {
		t.Error("isoWeekKey returned empty string")
	}
	if result[4] != '-' || result[5] != 'W' {
		t.Errorf("isoWeekKey format wrong: %q", result)
	}
}

func TestBuildID(t *testing.T) {
	id := buildID("mov")
	if len(id) < 10 {
		t.Errorf("buildID too short: %q", id)
	}
	if id[:4] != "mov-" {
		t.Errorf("buildID prefix wrong: %q", id)
	}
}
