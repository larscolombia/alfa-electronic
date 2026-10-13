package suppliers

import (
	"testing"
)

func TestNormalizeGrade(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"A", "A"},
		{"B", "B"},
		{"C", "C"},
		{"D", "D"},
		{"a", "A"},
		{"b", "B"},
		{"X", "A"},
		{"", "A"},
		{"  A  ", "A"},
	}

	for _, tt := range tests {
		result := normalizeGrade(tt.input)
		if result != tt.expected {
			t.Errorf("normalizeGrade(%q) = %q, want %q", tt.input, result, tt.expected)
		}
	}
}

func TestNormalizeTitle(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"Sr.", "Sr."},
		{"Sra.", "Sra."},
		{"", "Sr."},
		{"Dr.", "Sr."},
		{"  Sra.  ", "Sra."},
	}

	for _, tt := range tests {
		result := normalizeTitle(tt.input)
		if result != tt.expected {
			t.Errorf("normalizeTitle(%q) = %q, want %q", tt.input, result, tt.expected)
		}
	}
}
