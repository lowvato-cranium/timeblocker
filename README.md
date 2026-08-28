# timeBlocker

A Pomodoro-style work timer: cycle between a "work" increment and an "other
things" increment, and track the tasks you work on along the way.

## Stack

- **Server**: Express + TypeScript, [Drizzle ORM](https://orm.drizzle.team/)
  over SQLite (`better-sqlite3`), organized by domain (`auth`, `tasks`, `timer`).
- **Client**: React + Vite + TypeScript.
- **Auth**: cookie-based sessions for a small, fixed set of users provisioned
  via CLI (no public sign-up).

## Setup

```bash
npm install
npm run db:generate      # generate SQL migrations from the schema
npm run user:create -- <username> <password>
npm run dev               # runs server (http://localhost:4000) and client (http://localhost:5173)
```

Open http://localhost:5173 and sign in with the user you created.

## Production build

```bash
npm run build
npm start
```

`npm start` serves the built client from the server process on `PORT`
(default `4000`).
