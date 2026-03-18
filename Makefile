# Spenza Webhook System Makefile
# Orchestrates RabbitMQ (Docker), Local Postgres, Backend, and Frontend

BACKEND_DIR = source_code/spenza-backend
FRONTEND_DIR = source_code/spenza-frontend

.PHONY: help install up down db-init seed backend frontend

help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies for both apps"
	@echo "  make up         - Start RabbitMQ (Docker) and both apps locally"
	@echo "  make down       - Stop Docker containers and local Node processes"
	@echo "  make db-init    - Run migrations on local Postgres"
	@echo "  make seed       - Seed initial event types"
	@echo "  make backend    - Run only the backend locally"
	@echo "  make frontend   - Run only the frontend locally"

install:
	cd $(BACKEND_DIR) && pnpm install
	cd $(FRONTEND_DIR) && pnpm install

up:
	docker-compose up -d rabbitmq
	@echo "RabbitMQ is starting. Launching apps..."
	# Backgrounding is shell-dependent. On Windows PowerShell, it's best to run in separate terminals.
	# This command attempts to start them, but for the best experience, use 'make backend' and 'make frontend' in separate tabs.
	cd $(BACKEND_DIR) && start pnpm dev
	cd $(FRONTEND_DIR) && start pnpm dev

down:
	docker-compose down
	-taskkill /F /IM node.exe /T

db-init:
	cd $(BACKEND_DIR) && pnpm migration:run

seed:
	cd $(BACKEND_DIR) && npx ts-node -r tsconfig-paths/register src/database/seeds/event-types.seed.ts

backend:
	cd $(BACKEND_DIR) && pnpm dev

frontend:
	cd $(FRONTEND_DIR) && pnpm dev
