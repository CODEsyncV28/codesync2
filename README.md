# 🌍 GlobeTrotter
**Empowering Personalized, Multi-City Travel Planning**

![Hackathon](https://img.shields.io/badge/Hackathon-Odoo%20x%20LDCE-6C5CE7?style=flat-square)

Built for the **Odoo × LDCE Hackathon 2026** — Virtual Qualifying Round

---

## Table of Contents
- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Database Design](#database-design)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Team](#team)
- [Hackathon Details](#hackathon-details)
- [Future Scope](#future-scope)
- [License](#license)

---

## About the Project

Planning a multi-city trip usually means juggling spreadsheets, browser tabs, and half-finished notes. **GlobeTrotter** replaces that with one connected workspace — pick your cities, add activities, watch your budget update automatically, and share the finished plan with a single link.

The app is built around a relational data model that ties users, trips, stops, cities, activities, and expenses together, so every itinerary is fully structured and queryable rather than a static document.

**What it solves:**
- Multi-city trip planning is scattered across too many disconnected tools
- Travelers rarely know their real trip cost until it's too late
- There's no easy way to visualize a full itinerary or share it with others

**How it works:** create a trip → add city stops → attach activities → watch the budget and calendar build themselves → share it publicly or with friends.

---

## Key Features

- [ ] **Authentication** — email/password signup & login, with validation and password recovery
- [ ] **Dashboard** — upcoming trips, recommended destinations, and budget highlights at a glance
- [ ] **Trip Creation** — name, date range, description, and optional cover photo for every trip
- [ ] **My Trips** — card-based list of all trips with edit / view / delete actions
- [ ] **Itinerary Builder** — add city stops, assign dates, attach activities, reorder the route
- [ ] **Itinerary View** — day-wise breakdown by city or timeline, with time & cost per activity
- [ ] **City Search** — search and filter destinations by country/region, cost index, and popularity
- [ ] **Activity Search** — browse activities by type, cost, and duration, with images & descriptions
- [ ] **Budget & Cost Breakdown** — auto-calculated costs across transport, stay, activities & meals, with charts and over-budget alerts
- [ ] **Calendar / Timeline View** — drag-to-reorder calendar view of the full trip
- [ ] **Public Trip Sharing** — read-only public itinerary page with a "Copy Trip" action and social sharing
- [ ] **Profile & Settings** — manage personal info, preferences, saved destinations, account deletion
- [ ] **Admin Analytics Dashboard** *(stretch goal)* — platform-wide trends across trips, cities, and users

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | `<e.g. React / Next.js>` |
| Backend | `<e.g. Node.js + Express / Django>` |
| Database | `<e.g. PostgreSQL / MySQL>` |
| Styling | `<e.g. Tailwind CSS>` |
| Charts | `<e.g. Chart.js / Recharts>` |
| Auth | `<e.g. JWT / Firebase Auth>` |
| Deployment | `<e.g. Vercel / Render>` |

---

## Database Design

GlobeTrotter runs on a relational schema, roughly:

- **Users** — account details & preferences
- **Trips** — name, date range, description, owner (FK → Users)
- **Stops** — city + trip reference, arrival/departure dates, order index
- **Cities** — name, country, cost index, popularity score
- **Activities** — name, category, cost, duration, description
- **Trip_Activities** — join table linking activities to a specific stop/day
- **Expenses** — category (transport / stay / activities / meals), amount, trip reference

---

## Getting Started

### Prerequisites
- `<Runtime — e.g. Node.js v18+ or Python 3.x>`
- `<Database — e.g. PostgreSQL 14+>`

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>

# 2. Install dependencies
<your install command>          # e.g. npm install / pip install -r requirements.txt

# 3. Configure environment variables
cp .env.example .env            # then fill in the values below

# 4. Run the app
<your run command>              # e.g. npm run dev / python manage.py runserver
```

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Connection string for your database |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `PORT` | Port the server runs on |

---

## Project Structure

```
globetrotter/
├── client/          # Frontend app
├── server/          # Backend API
│   ├── routes/
│   ├── models/
│   └── controllers/
├── database/         # Schema / migrations
└── README.md
```

---

## Team

| Name | Role |
|---|---|
| Jaykumar Desai | Team Lead , Testing |
| Vansh Maurya | AI/ML , Creation , presenter |
| Nooman Baluchi | Frontend Developer |
| Moksh Patel | Backend Developer |
---

## Hackathon Details

- **Event:** Odoo × LDCE Hackathon 2026
- **Round:** Virtual Qualifying Round
- **Institution:** Government Engineering College, Bharuch (GEC Bharuch), Gujarat
- **Problem Statement:** GlobeTrotter — Empowering Personalized Travel Planning
- **Reference Mockup:** [Excalidraw design](https://link.excalidraw.com/l/65VNwvy7c4X/6CzbTgEeSr1)

---

## Future Scope

- Real-time collaborative editing on shared trips
- AI-assisted itinerary suggestions based on budget & interests
- Currency conversion for international trips
- Integration with flight/hotel booking APIs
- Calendar sync (Google/Apple Calendar)
- Offline-first / PWA support

---

## License

Built for hackathon evaluation. Add a license (MIT is a common default) if you plan to open-source it later.
