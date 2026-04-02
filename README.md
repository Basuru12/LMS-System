# LMS Database (Mongoose)

## Setup

1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI` in `.env` if you are not using local MongoDB.
3. Install dependencies:
   - `npm install`

## Seed + Verify

- Seed data:
  - `npm run seed`
- Verify populated relationships:
  - `npm run verify`

## Collections

- `students`
- `teachers`
- `courses`
- `payments`
