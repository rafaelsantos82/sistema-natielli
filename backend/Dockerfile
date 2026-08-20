FROM golang:1.25-alpine AS builder

WORKDIR /app
RUN apk --no-cache add ca-certificates tzdata

COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-w -s" -o /out/api ./cmd/api

FROM alpine:3.20

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN apk --no-cache add ca-certificates tzdata wget

WORKDIR /srv
COPY --from=builder /out/api /srv/api
COPY --from=builder /app/migrations /srv/migrations

USER appuser
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health || exit 1

CMD ["/srv/api"]
