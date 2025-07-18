# Crypto Tracker Backend

[![Built with TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)](https://www.typescriptlang.org/)
[![Deployment Status](https://img.shields.io/badge/deployment-pending-lightgrey)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📈 Description

Production-ready backend for a crypto tracking app. Fetches, stores, and serves live and historical cryptocurrency data using Node.js, Express, TypeScript, Prisma, and PostgreSQL.

---

## 🚀 Live URL

- **Backend API:** <https://your-backend-url>

---

## 🧱 Tech Stack

- Node.js, Express, TypeScript
- PostgreSQL (Supabase/Neon)
- Prisma ORM
- Axios, node-cron
- express-rate-limit, helmet, cors, dotenv, morgan
- Zod (validation)

---

## ⚡ Features

- Fetches top 10 cryptocurrencies from CoinGecko
- Stores current and historical data
- Hourly cron job for data sync
- REST API for frontend consumption
- Rate limiting, security, and validation

---

## 🛠️ Setup Instructions

### 1. Clone & Install

```bash
git clone https://github.com/your-username/crypto-tracker-backend.git
cd crypto-tracker-backend
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### 3. Prisma Setup

```bash
npm run prisma:generate
npm run prisma:db:push
```

### 4. Start Development Server

```bash
npm run dev
```

---

## 🗄️ Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Express server port (default: 4000)
- `COINGECKO_API_URL` - (optional) CoinGecko endpoint
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` - API rate limiting

---

## 🗃️ Prisma Commands

- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:db:push` - Push schema to DB

---

## ⏰ Cron Job

- Uses `node-cron` to fetch and store data hourly
- Manual trigger: `POST /api/crypto/sync`

---

## 🛡️ Best Practices

- ESLint, Prettier, EditorConfig
- Strict TypeScript config
- .env.example included
- Typed APIs (Zod)
- Graceful error handling

---

## 🚀 Deployment

- Deploy to [Render](https://render.com), [Railway](https://railway.app), or [Fly.io](https://fly.io)
- Use free tier of [Supabase](https://supabase.com) or [NeonDB](https://neon.tech) for PostgreSQL

---

## 📸 Screenshots

- DB table with records: ![DB Table Screenshot](./screenshots/db-table.png)
- Cron execution log: ![Cron Log Screenshot](./screenshots/cron-log.png)

---

## 📄 License

MIT
