# Transportex

A redesigned logistics/cargo website with a working Node.js/Express backend.

```
Transportex/
├── frontend/     static site — open directly or serve with any static server
└── backend/      Node.js + Express + MongoDB REST API
```
## Upgrade from original static frontend with different UI and backend
**Frontend**
- Full visual redesign: dark "control room" theme, industrial display type
  (Space Grotesk) paired with Inter and IBM Plex Mono for data readouts.
- New signature element: a **live manifest** tracking ticket in the hero,
  with a dashed "route line" motif that repeats through the page.
- New sections that actually do something: a shipment tracker, a freight
  quote request form, and a contact form — all wired to the backend below.
- Same imagery/asset set as the original template, restyled.

**Backend** (new)
- Node.js + Express REST API, MongoDB database (via `mongoose`). Requires a
  MongoDB server (local install or a free MongoDB Atlas cluster).
- Endpoints for shipment tracking, contact messages, quote requests, and
  newsletter signups.
- Basic rate limiting on the write endpoints and CORS configuration.

## Running it locally

### 1. Start MongoDB

You need a MongoDB server running before starting the backend. Either:

- **Local install**: install MongoDB Community Server for your OS and make
  sure it's running (default connection: `mongodb://127.0.0.1:27017`), or
- **MongoDB Atlas (cloud, free tier)**: create a cluster at
  [mongodb.com/atlas](https://www.mongodb.com/atlas) and copy its connection
  string.

### 2. Start the backend

```bash
cd backend
npm install
cp .env.example .env      # defaults are fine for a local MongoDB install
# Edit MONGODB_URI in .env if you're using Atlas or a non-default host/port.
npm run seed               # loads 3 demo shipments to track
npm start                  # http://localhost:4000
```

Health check: `curl http://localhost:4000/api/health`

Demo tracking IDs after seeding: `TPX-48213-IN`, `TPX-90876-US`, `TPX-11209-DE`.

Demo admin credentials
username: admin
password: AdminPassword123

### 3. Start the frontend

The frontend is plain HTML/CSS/JS — no build step. Serve it with any static
server so `fetch()` calls work correctly (opening `index.html` directly with
`file://` also works in most browsers, but a local server is more reliable):

```bash
cd frontend
npx serve .                # or: python3 -m http.server 5500
```

Then open the printed URL (e.g. `http://localhost:5500`).

If your frontend runs on a different port than `5500`, add it to
`CORS_ORIGIN` in `backend/.env`, or set it before the API loads:

```html
<script>window.TRANSPORTEX_API_BASE_URL = "http://localhost:4000/api";</script>
```

(already the default — only needed if you move the backend elsewhere).

## API reference

| Method | Path                    | Purpose                                |
|--------|--------------------------|-----------------------------------------|
| GET    | `/api/health`            | Service status check                    |
| GET    | `/api/track/:trackingId` | Look up a shipment + its event history  |
| POST   | `/api/contact`           | Submit the contact form                 |
| GET    | `/api/contact`           | List stored contact messages (debug)    |
| POST   | `/api/quote`             | Submit a freight quote request          |
| GET    | `/api/quote`             | List stored quote requests (debug)      |
| POST   | `/api/newsletter`        | Subscribe an email address              |

All POST endpoints expect and return JSON, and return `400`/`404` with an
`{"error": "..."}` body on failure.

## Notes

- Data is stored in a MongoDB database (default name `transportex`, set via
  `MONGODB_URI` in `backend/.env`). The collections (and a default admin
  user) are created automatically on first run — just make sure a MongoDB
  server is reachable at that URI before starting the backend.
- The `GET /api/contact` and `GET /api/quote` endpoints are unauthenticated
  debug/admin views. Add auth before deploying this publicly.
- To reset demo data, drop the `transportex` database (e.g.
  `mongosh transportex --eval "db.dropDatabase()"`) and re-run `npm run seed`.
