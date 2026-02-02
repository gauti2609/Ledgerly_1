# Quick Start Guide (No Docker)

This guide provides instructions for running the **Financials Automation** application directly on your local machine without using Docker.

## Prerequisites

*   **Node.js**: Version 18 or higher.
*   **PostgreSQL**: A running instance of PostgreSQL (v14+).
    *   *Alternative*: You can use SQLite if you configure `backend/prisma/schema.prisma` and `.env` accordingly.

## 1. Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    *   Create a `.env` file in the `backend` directory.
    *   Add your database connection string and API keys:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/financials_db?schema=public"
    GEMINI_API_KEY="your_gemini_api_key_here"
    PORT=8002
    ```

4.  **Database Migration:**
    *   Run Prisma migrations to set up your database schema:
    ```bash
    npx prisma migrate dev --name init
    # OR if you just want to push schema without migration history:
    npx prisma db push
    ```

5.  **Seed Initial Data (Optional):**
    ```bash
    npx ts-node prisma/seed_migration.ts
    ```

6.  **Start the Backend Server:**
    ```bash
    npm run start:dev
    ```
    The backend will start on `http://localhost:8002`.

## 2. Frontend Setup

1.  **Open a new terminal and navigate to the root directory (or existing root):**
    ```bash
    # If you are in backend/, go back:
    cd ..
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Start the Frontend Development Server:**
    ```bash
    npm run dev
    ```
    The frontend will start on `http://localhost:3002`.

## 3. Accessing the Application

*   Open your browser and navigate to: **[http://localhost:3002](http://localhost:3002)**
*   **Default Login (if seeded):**
    *   Email: `gautam@smbcllp.com`
    *   Password: `password123`

## Troubleshooting

*   **Port Conflicts:** If ports 3002 or 8002 are in use, modify `vite.config.ts` (for frontend) or `.env` (for backend) to use different ports.
*   **Database Connection:** Ensure your PostgreSQL service is running and the credentials in `.env` are correct.
*   **API Connection:** If the frontend cannot connect to the backend, check the proxy settings in `vite.config.ts` or ensure the backend URL is correctly set in `services/apiService.ts`.
