# Ahd Steel Project

This is a full-stack management system for steel business operations, built with [Next.js](https://nextjs.org/), [MUI](https://mui.com/), [Prisma](https://www.prisma.io/), [Sequelize](https://sequelize.org/), and MySQL. It features user authentication, inventory, materials, clients, suppliers, invoicing, and more.

## Features

- Modern dashboard UI with MUI and Tailwind CSS
- User authentication and role management
- **Inventory & Supply Chain:**
    - Comprehensive material tracking (Raw Materials, Accessories, Finished Products).
    - "Smart" withdrawal logic supporting count and weight-based deductions.
    - Operating Issue Orders for factory material issuance.
- **Manufacturing & Job Orders:**
    - Detailed Job Order creation with specifications, engineering calculations, and accessory planning.
    - Printable Job Order forms for factory floor usage.
    - Integration with inventory for automatic material deduction and cost tracking.
- Client and supplier management
- Invoicing, payments, and price lists
- Attendance and daily salary tracking for workers
- Database migrations and seeding (Sequelize)

## Project Structure

- `src/` — Main application code (components, pages, views, utils, etc.)
- `models/` — Sequelize models
- `migrations/` — Sequelize migrations
- `seeders/` — Sequelize seeders
- `prisma/` — Prisma schema
- `config/` — Database and app config
- `public/` — Static assets
- `scripts/` — Utility scripts

## Getting Started

1. **Install dependencies:**

   ```bash
   pnpm install
   # or
   npm install
   # or
   yarn install
   ```

2. **Configure environment:**

   - Copy `.env.example` to `.env` and set your `DATABASE_URL` and other secrets.

3. **Run database migrations:**

   ```bash
   npx sequelize-cli db:migrate
   # or use scripts/run-neon-migration.js for Neon/Postgres
   ```

4. **Seed the database (optional):**

   ```bash
   npx sequelize-cli db:seed:all
   ```

5. **Start the development server:**

   ```bash
   pnpm dev
   # or
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database

- Default: MySQL (see `config/config.json` and `.env`)
- Prisma schema: `prisma/schema.prisma`
- Sequelize models/migrations: `models/`, `migrations/`

## Scripts

- `npx sequelize-cli db:migrate --config config/config.json` - run migrations to create `safes` table and add columns to `safe_entries` (required for multi-safe support)
- `node scripts/test-transfer.js` - quick script to test transferring between 'Personal Safe' and 'Main Safe' after migrations have run
- Utility scripts are in the `scripts/` folder for migrations, testing, and more.

## License

This project is licensed for commercial use.
