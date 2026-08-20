package logger

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"strings"
	"testing"
)

func TestProductionJSON(t *testing.T) {
	var buf bytes.Buffer
	cfg := Config{
		AppEnv:         "production",
		ServiceName:    "test-svc",
		LogFormat:      FormatJSON,
		LogLevel:       "info",
	}
	// Redirect via test helper — New uses stdout; test HandlerFormat + manual handler
	if HandlerFormat(cfg) != FormatJSON {
		t.Fatalf("expected json format")
	}
	opts := &slog.HandlerOptions{Level: slog.LevelInfo, ReplaceAttr: RedactAttr}
	h := slog.NewJSONHandler(&buf, opts)
	l := slog.New(h)
	l.Info("test", slog.String("service", "test-svc"))
	if !json.Valid(buf.Bytes()) {
		t.Fatalf("expected valid json: %s", buf.String())
	}
}

func TestDevelopmentText(t *testing.T) {
	if HandlerFormat(Config{AppEnv: "development"}) != FormatText {
		t.Fatal("expected text in development")
	}
}

func TestLogLevel(t *testing.T) {
	var buf bytes.Buffer
	opts := &slog.HandlerOptions{Level: slog.LevelInfo, ReplaceAttr: RedactAttr}
	l := slog.New(slog.NewTextHandler(&buf, opts))
	l.Debug("hidden")
	if buf.Len() > 0 {
		t.Fatal("debug should not be logged at info level")
	}
	l.Info("visible")
	if !strings.Contains(buf.String(), "visible") {
		t.Fatal("info should be logged")
	}
}

func TestParseLevel(t *testing.T) {
	if ParseLevel("warn", "production") != slog.LevelWarn {
		t.Fatal("expected warn")
	}
	if ParseLevel("", "production") != slog.LevelInfo {
		t.Fatal("expected info for production default")
	}
}
