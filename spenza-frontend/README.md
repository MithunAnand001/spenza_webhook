# Spenza Webhook Management Frontend

A React-based dashboard for managing webhook subscriptions and monitoring events in real-time.

## 🛠️ Key Features
- **Subscription Management**: Create, list, and cancel webhook event mappings.
- **Live Event Log**: A searchable, filterable, and sortable log of all delivery attempts.
- **Real-Time Updates**: Uses Server-Sent Events (SSE) to update the UI without page refreshes.
- **Secure Authentication**: JWT-based protected routes and session management.

## 🚀 Getting Started

1.  **Install Dependencies**:
    ```bash
    pnpm install
    ```
2.  **Environment Setup**:
    - Create a `.env` file based on `.env.example`.
    - `VITE_API_BASE_URL=http://localhost:3001/api`
3.  **Run Development Server**:
    ```bash
    pnpm dev
    ```

## 🏗️ Technical Stack
- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **Icons**: Custom SVG implementation
- **Routing**: React Router DOM v6
