# Spenza Webhook Backend

Node.js + Express + TypeScript webhook management API.

## Prerequisites
- Node.js 20+
- Docker Desktop
- pnpm

## Quick Start

1. Clone and install dependencies:
   ```bash
   pnpm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. Start infrastructure (RabbitMQ):
   ```bash
   docker compose up rabbitmq -d
   ```
   *Note: Using local PostgreSQL as per configuration.*

4. Run database migrations:
   ```bash
   pnpm migration:run
   ```

5. Seed event types:
   ```bash
   ts-node src/database/seeds/event-types.seed.ts
   ```

6. Start development server:
   ```bash
   pnpm dev
   ```

## RabbitMQ Dashboard
http://localhost:15672 (spenza_user / spenza_pass)

## Run Simulator
```bash
SUBSCRIPTION_ID=1 SIGNING_SECRET=your_secret ts-node src/simulator/simulate.ts
```