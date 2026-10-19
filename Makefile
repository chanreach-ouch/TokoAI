.PHONY: help up down build test logs format migrate

help: ## Show this help message
	@echo "TokoAI Developer Commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Start all services via Docker Compose
	docker compose up -d

down: ## Stop all services
	docker compose down

build: ## Rebuild all Docker containers
	docker compose build

logs: ## Tail logs for all services
	docker compose logs -f

test: ## Run backend tests with pytest
	.venv/Scripts/pytest tests/ -v

format: ## Format Python code with Ruff (if installed)
	ruff check . --fix
	ruff format .

# Future Alembic commands
migrate-create: ## Create a new DB migration (Usage: make migrate-create msg="add users")
	alembic revision --autogenerate -m "$(msg)"

migrate-up: ## Apply DB migrations to the database
	alembic upgrade head
