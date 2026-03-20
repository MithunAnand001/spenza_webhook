# Spenza Webhook System Makefile
# Orchestrates RabbitMQ (Docker), Local Postgres, Backend, and Frontend

BACKEND_DIR = spenza-backend
FRONTEND_DIR = spenza-frontend

.PHONY: help install setup up down db-init seed backend frontend

help:
	@echo "Spenza Webhook System Management"
	@echo "--------------------------------"
	@echo "Available commands:"
	@echo "  make install    - Install dependencies for both apps"
	@echo "  make setup      - Initialize .env files from examples"
	@echo "  make up         - Start infrastructure and both apps (Full Init)"
	@echo "  make down       - Stop infrastructure and local Node processes"
	@echo "  make backend    - Run backend with full init (Migrations + Seed)"
	@echo "  make frontend   - Run frontend development server"

install:
	cd $(BACKEND_DIR) && pnpm install
	cd $(FRONTEND_DIR) && pnpm install

setup:
	node -e "require('fs').copyFileSync('$(BACKEND_DIR)/.env.example', '$(BACKEND_DIR)/.env')"
	node -e "require('fs').copyFileSync('$(FRONTEND_DIR)/.env.example', '$(FRONTEND_DIR)/.env')"
	@echo "Environment files created. Please update $(BACKEND_DIR)/.env with your DB credentials."

up:
	docker-compose up -d rabbitmq
	@echo "Infrastructure is ready. Launching services..."
	@echo "Use 'make backend' and 'make frontend' in separate windows for best visibility."

down:
	docker-compose down
	-taskkill /F /IM node.exe /T

db-init:
	cd $(BACKEND_DIR) && pnpm migration:run

seed:
	cd $(BACKEND_DIR) && pnpm seed

backend:
	docker-compose up -d rabbitmq
	cd $(BACKEND_DIR) && pnpm dev:init

frontend:
	cd $(FRONTEND_DIR) && pnpm dev
