SHELL := /bin/sh

.PHONY: run test vet up down logs migrate-up migrate-down swagger verify-routes seed-admin seed-anamneses extract-anamneses seed-pacientes seed-pacientes-pendencias

run:
	go run ./cmd/api

test:
	go test ./...

vet:
	go vet ./...

up:
	docker compose up --build -d api db
	@$(MAKE) verify-routes

verify-routes:
	@chmod +x scripts/verify-routes.sh
	@./scripts/verify-routes.sh

down:
	docker compose down

logs:
	docker compose logs -f api db

migrate-up:
	docker compose --profile ops run --rm migrate

migrate-down:
	docker run --rm -v "$$(pwd)/migrations:/migrations" --network host migrate/migrate -path=/migrations -database "$$DATABASE_URL" down 1

swagger:
	go run github.com/swaggo/swag/cmd/swag@latest init -g cmd/api/main.go -o docs --parseDependency --parseInternal

# seed-admin roda no host: reescreve host "db" → 127.0.0.1 (porta exposta pelo compose).
# Opcional: defina DATABASE_URL_HOST no .env para override explícito.
seed-admin:
	@test -f .env && set -a && . ./.env && set +a; \
	if [ -n "$${DATABASE_URL_HOST:-}" ]; then \
		export DATABASE_URL="$$DATABASE_URL_HOST"; \
	elif [ -n "$${DATABASE_URL:-}" ]; then \
		export DATABASE_URL=$$(printf '%s' "$$DATABASE_URL" | sed -e 's/@db:/@127.0.0.1:/' -e 's/host=db/host=127.0.0.1/'); \
	fi; \
	go run ./cmd/seed-admin

# extract-anamneses: gera data/anamneses/*.draft.json e reviews/*.md a partir de docs/anamnese
extract-anamneses:
	go run ./cmd/extract-anamneses --repo-root=.. --promote

# seed-anamneses: UPSERT templates canônicos (*.json) na tabela anamneses
seed-anamneses:
	@test -f .env && set -a && . ./.env && set +a; \
	if [ -n "$${DATABASE_URL_HOST:-}" ]; then \
		export DATABASE_URL="$$DATABASE_URL_HOST"; \
	elif [ -n "$${DATABASE_URL:-}" ]; then \
		export DATABASE_URL=$$(printf '%s' "$$DATABASE_URL" | sed -e 's/@db:/@127.0.0.1:/' -e 's/host=db/host=127.0.0.1/'); \
	fi; \
	go run ./cmd/seed-anamneses $(ARGS)

seed-anamneses-dry-run:
	@$(MAKE) seed-anamneses ARGS="--dry-run"

# seed-pacientes: importa cadastro das planilhas e emite JSON de pendências comerciais.
# Ex.: make seed-pacientes ARGS='--dry-run --xlsx=/tmp/a.xlsx --xlsx=/tmp/b.xlsx'
seed-pacientes:
	@test -f .env && set -a && . ./.env && set +a; \
	if [ -n "$${DATABASE_URL_HOST:-}" ]; then \
		export DATABASE_URL="$$DATABASE_URL_HOST"; \
	elif [ -n "$${DATABASE_URL:-}" ]; then \
		export DATABASE_URL=$$(printf '%s' "$$DATABASE_URL" | sed -e 's/@db:/@127.0.0.1:/' -e 's/host=db/host=127.0.0.1/'); \
	fi; \
	go run ./cmd/seed-pacientes $(ARGS)

seed-pacientes-pendencias:
	@test -f .env && set -a && . ./.env && set +a; \
	if [ -n "$${DATABASE_URL_HOST:-}" ]; then \
		export DATABASE_URL="$$DATABASE_URL_HOST"; \
	elif [ -n "$${DATABASE_URL:-}" ]; then \
		export DATABASE_URL=$$(printf '%s' "$$DATABASE_URL" | sed -e 's/@db:/@127.0.0.1:/' -e 's/host=db/host=127.0.0.1/'); \
	fi; \
	go run ./cmd/seed-pacientes-pendencias $(ARGS)
