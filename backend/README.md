# ✅ backend/README.md
# Fundraising Portal Backend

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+

### Installation

1. Install dependencies:
```bash
npm install
```

2. Setup environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Create database:
```bash
createdb fundraising_db
```

4. Run migrations:
```bash
psql -d fundraising_db -f ../database/schema.sql
```

5. Seed database (optional):
```bash
node ../database/seed-data.js
```

6. Start server:
```bash
npm run dev
```

Server runs on: http://localhost:5000

## API Documentation

See `/docs/API_DOCUMENTATION.md`

## Testing
```bash
npm test                 # Run all tests
npm run test:coverage    # With coverage
npm test -- --watch      # Watch mode
```

## Project Structure
```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middleware
│   ├── models/         # Sequelize models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── tests/          # Test files
│   └── utils/          # Helper functions
└── server.js           # Entry point
```