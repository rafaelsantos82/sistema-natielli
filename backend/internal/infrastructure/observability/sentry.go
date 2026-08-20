package observability

import (
	"strings"
	"time"

	"espaco-terapia-os/backend/internal/config"
	platformlogger "espaco-terapia-os/backend/internal/platform/logger"

	"github.com/getsentry/sentry-go"
)

func InitSentry(cfg *config.Config) error {
	if strings.TrimSpace(cfg.SentryDSN) == "" {
		return nil
	}

	return sentry.Init(sentry.ClientOptions{
		Dsn:              cfg.SentryDSN,
		Environment:      cfg.SentryEnvironment,
		EnableTracing:    cfg.SentryEnableTrace,
		TracesSampleRate: cfg.SentryTraceRate,
		BeforeSend: func(event *sentry.Event, hint *sentry.EventHint) *sentry.Event {
			if event.Request != nil {
				if event.Request.Headers == nil {
					event.Request.Headers = map[string]string{}
				}
				for _, key := range platformlogger.SensitiveHeaderKeys {
					if _, ok := event.Request.Headers[key]; ok {
						event.Request.Headers[key] = "[Filtered]"
					}
				}
				event.Request.QueryString = "[Filtered]"
			}
			return event
		},
	})
}

func FlushSentry() {
	sentry.Flush(2 * time.Second)
}
