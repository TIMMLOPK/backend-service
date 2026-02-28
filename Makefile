#!/usr/bin/make

setup:
	@./scripts/setup.sh

build:
	@./scripts/setup.sh
	docker compose build

run:
	docker compose up app frontend

run-d:
	docker compose up -d app frontend

run-backend:
	docker compose up app

run-frontend:
	docker compose up frontend

stop:
	docker compose down

lint:
	pre-commit run --all-files

test:
	python3 -m pytest tests/ -v

test-cov:
	python3 -m pytest tests/ -v --cov=app --cov-report=term-missing

# Development tools
mongo-express:
	docker compose --profile dev up mongo-express
