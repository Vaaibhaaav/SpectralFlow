package telemetry

import (
	"regexp"
)

var piiPatterns = []*regexp.Regexp{
	// Email 
	regexp.MustCompile(`[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}`),
	// Phone Pattern 
	regexp.MustCompile(`\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}`),
	// IP Pattern
	regexp.MustCompile(`\b(?:\d{1,3}\.){3}\d{1,3}\b`),
	//  Credit Card Pattern 
	regexp.MustCompile(`\b\d{13,19}\b`),
}

const replacementToken = "[PII_REDACTED]"

// ScrubPII detects and replaces PII in text
func ScrubPII(text string) string {
	if text == "" {
		return text
	}
 	for _, pattern := range piiPatterns {
		if pattern.MatchString(text) {
			text = pattern.ReplaceAllString(text, replacementToken)
		}
	}
	return text
}