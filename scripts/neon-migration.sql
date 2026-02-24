-- Neon PostgreSQL Migration Script for Ahd Steel 
-- Converted from SQL Server schema
-- Run this script against your Neon database

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS "UserRoles" CASCADE;
DROP TABLE IF EXISTS "PasswordResets" CASCADE;
DROP TABLE IF EXISTS "daily_salaries" CASCADE;
DROP TABLE IF EXISTS "attendance" CASCADE;
DROP TABLE IF EXISTS "inventory_transactions" CASCADE;
DROP TABLE IF EXISTS "invoices" CASCADE;
DROP TABLE IF EXISTS "safe_entries" CASCADE;
DROP TABLE IF EXISTS "suppliers" CASCADE;
DROP TABLE IF EXISTS "clients" CASCADE;
DROP TABLE IF EXISTS "materials" CASCADE;
DROP TABLE IF EXISTS "workers" CASCADE;
DROP TABLE IF EXISTS "Roles" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "SequelizeMeta" CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SequelizeMeta table (for Sequelize migrations tracking)
CREATE TABLE "SequelizeMeta" (
    "name" VARCHAR(255) NOT NULL PRIMARY KEY
);

-- Users table
CREATE TABLE "users" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255),
    "email" VARCHAR(255) UNIQUE,
    "password" VARCHAR(255),
    "emailVerified" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Roles table
CREATE TABLE "Roles" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255),
    "description" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL,
    "updatedAt" TIMESTAMPTZ NOT NULL
);

-- UserRoles table
CREATE TABLE "UserRoles" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
    "roleId" INTEGER REFERENCES "Roles"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL,
    "updatedAt" TIMESTAMPTZ NOT NULL
);

-- PasswordResets table
CREATE TABLE "PasswordResets" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
    "token" VARCHAR(255),
    "expires" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL,
    "updatedAt" TIMESTAMPTZ NOT NULL
);

-- Workers table
CREATE TABLE "workers" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE,
    "phone" VARCHAR(255),
    "position" VARCHAR(255),
    "department" VARCHAR(255),
    "baseSalary" DECIMAL(10, 2) DEFAULT 0,
    "hireDate" TIMESTAMPTZ,
    "status" VARCHAR(255) CHECK ("status" IN ('active', 'inactive', 'on-leave')),
    "createdAt" TIMESTAMPTZ,
    "updatedAt" TIMESTAMPTZ
);

-- Attendance table
CREATE TABLE "attendance" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "workerId" UUID NOT NULL REFERENCES "workers"("id") ON DELETE CASCADE,
    "date" TIMESTAMPTZ NOT NULL,
    "status" VARCHAR(255) CHECK ("status" IN ('present', 'absent', 'half-day', 'leave')),
    "checkInTime" TIME,
    "checkOutTime" TIME,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ,
    "updatedAt" TIMESTAMPTZ
);

-- Daily Salaries table
CREATE TABLE "daily_salaries" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "workerId" UUID NOT NULL REFERENCES "workers"("id") ON DELETE CASCADE,
    "date" TIMESTAMPTZ NOT NULL,
    "dailyAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "bonus" DECIMAL(10, 2) DEFAULT 0,
    "deduction" DECIMAL(10, 2) DEFAULT 0,
    "totalAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ,
    "updatedAt" TIMESTAMPTZ
);

-- Clients table
CREATE TABLE "clients" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255),
    "profile" TEXT,
    "budget" DECIMAL(18, 2),
    "material" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL,
    "updatedAt" TIMESTAMPTZ NOT NULL
);

-- Suppliers table
CREATE TABLE "suppliers" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "email" VARCHAR(255),
    "phone" VARCHAR(255),
    "address" TEXT,
    "city" VARCHAR(255),
    "country" VARCHAR(255),
    "bankName" VARCHAR(255),
    "accountNumber" VARCHAR(255),
    "iban" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL,
    "updatedAt" TIMESTAMPTZ NOT NULL
);

-- Materials table
CREATE TABLE "materials" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255),
    "sku" VARCHAR(255),
    "unit" VARCHAR(255),
    "type" VARCHAR(255),
    "stock" DECIMAL(18, 2) DEFAULT 0,
    "createdBy" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "materialName" VARCHAR(255),
    "grade" VARCHAR(255),
    "image" VARCHAR(255)
);

-- Inventory Transactions table
CREATE TABLE "inventory_transactions" (
    "id" SERIAL PRIMARY KEY,
    "materialId" INTEGER REFERENCES "materials"("id") ON DELETE CASCADE,
    "change" DECIMAL(18, 2),
    "action" VARCHAR(255),
    "source" VARCHAR(255),
    "reference" VARCHAR(255),
    "user" VARCHAR(255),
    "note" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL,
    "updatedAt" TIMESTAMPTZ NOT NULL
);

-- Safe Entries table
CREATE TABLE "safe_entries" (
    "id" SERIAL PRIMARY KEY,
    "month" VARCHAR(255),
    "date" TIMESTAMPTZ,
    "description" TEXT,
    "project" VARCHAR(255),
    "incoming" DECIMAL(18, 2),
    "outgoing" DECIMAL(18, 2),
    "balance" DECIMAL(18, 2),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "incomingMethod" VARCHAR(255),
    "outgoingMethod" VARCHAR(255),
    "incomingTxn" VARCHAR(255),
    "outgoingTxn" VARCHAR(255),
    "clientId" INTEGER REFERENCES "clients"("id") ON DELETE SET NULL,
    "customer" VARCHAR(255)
);

-- Invoices table
CREATE TABLE "invoices" (
    "id" SERIAL PRIMARY KEY,
    "number" VARCHAR(255),
    "clientId" INTEGER REFERENCES "clients"("id") ON DELETE SET NULL,
    "date" TIMESTAMPTZ,
    "dueDate" TIMESTAMPTZ,
    "items" TEXT,
    "total" DECIMAL(18, 2),
    "status" VARCHAR(255),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "manufacturing" TEXT,
    "taxPercent" DECIMAL(5, 2),
    "taxAmount" DECIMAL(18, 2),
    "discount" DECIMAL(18, 2) DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX idx_attendance_workerid ON "attendance"("workerId");
CREATE INDEX idx_attendance_date ON "attendance"("date");
CREATE INDEX idx_daily_salaries_workerid ON "daily_salaries"("workerId");
CREATE INDEX idx_daily_salaries_date ON "daily_salaries"("date");
CREATE INDEX idx_inventory_transactions_materialid ON "inventory_transactions"("materialId");
CREATE INDEX idx_safe_entries_date ON "safe_entries"("date");
CREATE INDEX idx_safe_entries_clientid ON "safe_entries"("clientId");
CREATE INDEX idx_invoices_clientid ON "invoices"("clientId");
CREATE INDEX idx_invoices_date ON "invoices"("date");
CREATE INDEX idx_userroles_userid ON "UserRoles"("userId");
CREATE INDEX idx_userroles_roleid ON "UserRoles"("roleId");

-- Insert migration tracking records
INSERT INTO "SequelizeMeta" ("name") VALUES
    ('20251227152347-create-users.js'),
    ('20251227153322-create-role.js'),
    ('20251227153341-create-user-role.js'),
    ('20251227153359-create-password-reset.js'),
    ('20251227190000-create-safe-entries.js'),
    ('20251227194000-add-safeentry-payment-fields.js'),
    ('20251227195500-create-materials.js'),
    ('20251227195600-create-inventory-transactions.js'),
    ('20251228121000-add-unique-sku-to-materials.js'),
    ('20251228140000-create-workers.js'),
    ('20251228140100-create-attendance.js'),
    ('20251228140200-create-daily-salaries.js'),
    ('20251228180000-add-material-fields.js'),
    ('20251228190000-create-clients.js'),
    ('20251228191000-create-suppliers.js'),
    ('20251229120000-add-clientid-to-safe-entries.js'),
    ('20251229123000-add-customer-to-safe-entries.js'),
    ('20251229123000-create-invoices.js'),
    ('20251229124500-add-manufacturing-to-invoices.js'),
    ('20251229130000-add-tax-to-invoices.js'),
    ('20251229131000-add-discount-to-invoices.js'),
    ('20251230120000-create-price-lists.js');

-- Done!
SELECT 'Migration completed successfully!' as status;
