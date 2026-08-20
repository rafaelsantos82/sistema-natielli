.PHONY: deploy-prod deploy-bootstrap deploy-build-push help up migrate-up migrate-down

help:
	@echo "Targets:"
	@echo "  up                 docker compose up (backend)"
	@echo "  migrate-up         apply SQL migrations (backend)"
	@echo "  migrate-down       rollback last migration (backend)"
	@echo "  deploy-prod        Pull on pstec + deploy Natielli (ports 8084/8085)"
	@echo "  deploy-bootstrap   First-time Natielli setup on shared VM pstec"
	@echo "  deploy-build-push  Build linux/amd64 natielli images on Mac and load on pstec"

up:
	$(MAKE) -C backend up

migrate-up:
	$(MAKE) -C backend migrate-up

migrate-down:
	$(MAKE) -C backend migrate-down

deploy-prod:
	./deploy/scripts/deploy-from-mac.sh deploy

deploy-bootstrap:
	./deploy/scripts/deploy-from-mac.sh bootstrap

deploy-build-push:
	./deploy/scripts/deploy-from-mac.sh build-push
