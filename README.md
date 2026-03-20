# Spenza Webhook Management System

A robust, full-stack webhook management system designed for high reliability, security, and real-time observability.

## 🚀 Quick Start (Using Makefile)

The easiest way to run the entire system is using the provided `Makefile`.

1.  **Install Dependencies**:
    ```bash
    make install
    ```
2.  **Environment Setup**:
    - Copy `spenza-backend/.env.example` to `spenza-backend/.env` and update your database credentials.
    - Copy `spenza-frontend/.env.example` to `spenza-frontend/.env`.
3.  **Start the Backend**:
    - You can initialize and start the backend with a single command:
      ```bash
      cd spenza-backend
      pnpm dev:init
      ```
    - *This runs migrations, seeds the database, and starts the server.*

4.  **Start the Frontend**:
    ```bash
    cd spenza-frontend
    pnpm dev
    ```

## 🧪 Testing with the Simulator

To test the end-to-end flow without a real external source, use the built-in simulator script:

1.  **Obtain Credentials**: Create a subscription in the UI and copy the **Subscription UUID** and **Signing Secret**.
2.  **Run the Simulator**:
    ```bash
    cd spenza-backend
    $env:SUBSCRIPTION_UUID="your_uuid"
    $env:SIGNING_SECRET="your_secret"
    npx ts-node -r tsconfig-paths/register src/simulator/simulate.ts
    ```
    *(Note: Use `export` instead of `$env:` on Linux/macOS)*

## 🏗️ Architectural Decisions

### 1. Asynchronous Processing (RabbitMQ)
We decouple the **Ingestion** of webhooks from their **Delivery**. When a webhook hits our API, we validate it and respond with a `202 Accepted` immediately. The actual delivery work is offloaded to a RabbitMQ queue. 
- **Benefit**: The API remains highly responsive, and we can handle traffic spikes without dropping events.

### 2. Reliability & Retry Logic
Webhook delivery is inherently unreliable (target servers go down). We implemented an **Exponential Backoff** retry strategy. Failed deliveries are moved to a retry queue with increasing delays (5s, 10s, 20s) before being marked as `FAILED`.

### 3. Security by Design
- **HMAC SHA-256**: External sources must sign payloads using a shared secret. We use `timingSafeEqual` to prevent timing attacks.
- **AES-256 Encryption**: Callback credentials (passwords/tokens) are encrypted at rest in our PostgreSQL database using the `CRYPTO_SECRET`.
- **JWT Authentication**: All user-facing management routes are protected by JSON Web Tokens.

### 4. Real-Time Observability (WebSockets)
Instead of polling the database or using basic SSE, the frontend uses **authenticated WebSockets (Socket.io)**. The delivery worker "broadcasts" the result of every delivery attempt to private user rooms, allowing the dashboard to update instantly and securely.

## 🛠️ Technology Stack
- **Backend**: Node.js, Express, TypeScript, TypeORM, PostgreSQL.
- **Messaging**: RabbitMQ.
- **Frontend**: React, TypeScript, TanStack Query, Tailwind CSS.

---

## 📖 Component Documentation
- [Backend README](./spenza-backend/README.md)
- [Frontend README](./spenza-frontend/README.md)
