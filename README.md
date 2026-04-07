# LMS Database (Mongoose)

## Setup

1. Create a `.env` file (if not already present).
2. Set `MONGODB_URI` in `.env` if you are not using local MongoDB.
3. Set `SESSION_SECRET` in `.env` for teacher login sessions.
4. Optional: set `SEED_TEACHER_PASSWORD` in `.env` to override default seed password.
5. Install dependencies:
   - `npm install`

## Seed + Verify

- Seed data:
  - `npm run seed`
- Verify populated relationships:
  - `npm run verify`

## Teacher Login (Seeded)

After `npm run seed`, default teacher accounts are:

- `asha.verma`
- `ravi.nair`

Password is:

- `SEED_TEACHER_PASSWORD` (from `.env`) if set, otherwise `Teacher@123`

## Collections

- `students`
- `teachers`
- `courses`
- `payments`
