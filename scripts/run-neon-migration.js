// Neon PostgreSQL Migration Script
// Run with: node scripts/run-neon-migration.js

const { Client } = require('pg');
require('dotenv').config();
const connectionString = process.env.DATABASE_URL;

const migrationSQL = `
-- Setup
SET timezone = 'UTC';
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cleanup (Drops)
DROP TABLE IF EXISTS "attendance" CASCADE;
DROP TABLE IF EXISTS "client_attachments" CASCADE;
DROP TABLE IF EXISTS "daily_salaries" CASCADE;
DROP TABLE IF EXISTS "inventory_transactions" CASCADE;
DROP TABLE IF EXISTS "invoices" CASCADE;
DROP TABLE IF EXISTS "material_items" CASCADE;
DROP TABLE IF EXISTS "material_pieces" CASCADE;
DROP TABLE IF EXISTS "materials" CASCADE;
DROP TABLE IF EXISTS "PasswordResets" CASCADE;
DROP TABLE IF EXISTS "price_lists" CASCADE;
DROP TABLE IF EXISTS "project_activities" CASCADE;
DROP TABLE IF EXISTS "project_manufacturing" CASCADE;
DROP TABLE IF EXISTS "project_materials" CASCADE;
DROP TABLE IF EXISTS "project_payments" CASCADE;
DROP TABLE IF EXISTS "project_phases" CASCADE;
DROP TABLE IF EXISTS "projects" CASCADE;
DROP TABLE IF EXISTS "safe_entries" CASCADE;
DROP TABLE IF EXISTS "safes" CASCADE;
DROP TABLE IF EXISTS "suppliers" CASCADE;
DROP TABLE IF EXISTS "UserRoles" CASCADE;
DROP TABLE IF EXISTS "Roles" CASCADE;
DROP TABLE IF EXISTS "wallet_transactions" CASCADE;
DROP TABLE IF EXISTS "wallets" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "workers" CASCADE;
DROP TABLE IF EXISTS "clients" CASCADE;
DROP TABLE IF EXISTS "SequelizeMeta" CASCADE;

-- Tables

CREATE TABLE "SequelizeMeta" (
  "name" VARCHAR(255) NOT NULL PRIMARY KEY
);

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255),
  "email" VARCHAR(255) UNIQUE,
  "password" VARCHAR(255),
  "emailVerified" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "Roles" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255),
  "description" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "UserRoles" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER,
  "roleId" INTEGER,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "PasswordResets" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER,
  "token" VARCHAR(255),
  "expires" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "workers" (
  "id" VARCHAR(36) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255),
  "phone" VARCHAR(255),
  "position" VARCHAR(255),
  "department" VARCHAR(255),
  "baseSalary" DECIMAL(10,2) DEFAULT 0.00,
  "hireDate" TIMESTAMP,
  "status" VARCHAR(255) CHECK ("status" IN ('active','inactive','on-leave')) DEFAULT 'active',
  "createdAt" TIMESTAMP,
  "updatedAt" TIMESTAMP
);

CREATE TABLE "attendance" (
  "id" VARCHAR(36) PRIMARY KEY,
  "workerId" VARCHAR(36) NOT NULL,
  "date" TIMESTAMP NOT NULL,
  "status" VARCHAR(255) CHECK ("status" IN ('present','absent','half-day','leave')) DEFAULT 'present',
  "checkInTime" TIME,
  "checkOutTime" TIME,
  "notes" TEXT,
  "createdAt" TIMESTAMP,
  "updatedAt" TIMESTAMP
);

CREATE TABLE "daily_salaries" (
  "id" VARCHAR(36) PRIMARY KEY,
  "workerId" VARCHAR(36) NOT NULL,
  "date" TIMESTAMP NOT NULL,
  "dailyAmount" DECIMAL(10,2) DEFAULT 0.00,
  "bonus" DECIMAL(10,2) DEFAULT 0.00,
  "deduction" DECIMAL(10,2) DEFAULT 0.00,
  "totalAmount" DECIMAL(10,2) DEFAULT 0.00,
  "notes" TEXT,
  "createdAt" TIMESTAMP,
  "updatedAt" TIMESTAMP
);

CREATE TABLE "clients" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(255),
  "profile" TEXT,
  "budget" DECIMAL(18,2),
  "material" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "client_attachments" (
  "id" SERIAL PRIMARY KEY,
  "clientId" INTEGER NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "category" VARCHAR(50) DEFAULT 'general',
  "fileName" VARCHAR(255) NOT NULL,
  "filePath" VARCHAR(500) NOT NULL,
  "fileSize" INTEGER,
  "mimeType" VARCHAR(100),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "suppliers" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255),
  "phone" VARCHAR(255),
  "address" TEXT,
  "city" VARCHAR(255),
  "country" VARCHAR(255),
  "bankName" VARCHAR(255),
  "accountNumber" VARCHAR(255),
  "iban" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "safes" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "type" VARCHAR(255),
  "isDefault" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL,
  "ownerId" INTEGER
);

CREATE TABLE "safe_entries" (
  "id" SERIAL PRIMARY KEY,
  "month" VARCHAR(255),
  "date" TIMESTAMP,
  "description" TEXT,
  "project" VARCHAR(255),
  "incoming" DECIMAL(18,2),
  "outgoing" DECIMAL(18,2),
  "balance" DECIMAL(18,2),
  "incomingMethod" VARCHAR(255),
  "outgoingMethod" VARCHAR(255),
  "incomingTxn" VARCHAR(255),
  "outgoingTxn" VARCHAR(255),
  "clientId" INTEGER,
  "customer" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "safeId" INTEGER,
  "targetSafeId" INTEGER,
  "entryType" VARCHAR(255) DEFAULT 'incoming'
);

CREATE TABLE "materials" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255),
  "sku" VARCHAR(255),
  "unit" VARCHAR(255),
  "type" VARCHAR(255),
  "stock" DECIMAL(18,2) DEFAULT 0.00,
  "createdBy" VARCHAR(255),
  "materialName" VARCHAR(255),
  "grade" VARCHAR(255),
  "image" VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL,
  "originalLength" DECIMAL(18,2),
  "originalWidth" DECIMAL(18,2),
  "count" INTEGER DEFAULT 0,
  "weight" DECIMAL(18,4) DEFAULT 0.0000
);

CREATE TABLE "material_items" (
  "id" SERIAL PRIMARY KEY,
  "materialId" INTEGER NOT NULL,
  "dimensionType" VARCHAR(255),
  "quantity" DECIMAL(18,2) DEFAULT 1.00,
  "length" DECIMAL(18,4),
  "width" DECIMAL(18,4),
  "area" DECIMAL(24,4),
  "unit" VARCHAR(255) DEFAULT 'cm',
  "metadata" JSON,
  "status" VARCHAR(255) DEFAULT 'available',
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);

CREATE TABLE "material_pieces" (
  "id" SERIAL PRIMARY KEY,
  "materialId" INTEGER NOT NULL,
  "length" DECIMAL(18,2),
  "width" DECIMAL(18,2),
  "quantity" DECIMAL(18,2) NOT NULL DEFAULT 1.00,
  "isLeftover" BOOLEAN DEFAULT false,
  "parentPieceId" INTEGER,
  "status" VARCHAR(255) DEFAULT 'available',
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL,
  "clientId" INTEGER
);

CREATE TABLE "inventory_transactions" (
  "id" SERIAL PRIMARY KEY,
  "materialId" INTEGER,
  "change" DECIMAL(18,2),
  "action" VARCHAR(255),
  "source" VARCHAR(255),
  "reference" VARCHAR(255),
  "user" VARCHAR(255),
  "note" TEXT,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL,
  "materialPieceId" INTEGER
);

CREATE TABLE "price_lists" (
  "id" SERIAL PRIMARY KEY,
  "clientId" INTEGER,
  "clientName" VARCHAR(255),
  "projectName" VARCHAR(255),
  "projectDescription" TEXT,
  "items" TEXT,
  "manufacturingItems" TEXT,
  "notes" TEXT,
  "validUntil" TIMESTAMP,
  "status" VARCHAR(255) DEFAULT 'draft',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "projects" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "clientId" INTEGER,
  "clientName" VARCHAR(255),
  "description" TEXT,
  "location" VARCHAR(255),
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  "status" VARCHAR(50) DEFAULT 'completed',
  "totalCost" DECIMAL(18,2),
  "totalRevenue" DECIMAL(18,2),
  "notes" TEXT,
  "attachments" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "priority" VARCHAR(20) DEFAULT 'normal',
  "projectNumber" VARCHAR(50),
  "expectedDeliveryDate" TIMESTAMP,
  "actualDeliveryDate" TIMESTAMP,
  "progressPercent" INTEGER DEFAULT 0
);

CREATE TABLE "invoices" (
  "id" SERIAL PRIMARY KEY,
  "number" VARCHAR(255),
  "clientId" INTEGER,
  "date" TIMESTAMP,
  "dueDate" TIMESTAMP,
  "items" TEXT,
  "total" DECIMAL(18,2),
  "status" VARCHAR(255),
  "notes" TEXT,
  "manufacturing" TEXT,
  "taxPercent" DECIMAL(5,2),
  "taxAmount" DECIMAL(18,2),
  "discount" DECIMAL(18,2) DEFAULT 0.00,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "paymentMethod" VARCHAR(255),
  "bankName" VARCHAR(255),
  "transactionNumber" VARCHAR(255),
  "paidAmount" DECIMAL(18,2) DEFAULT 0.00,
  "projectId" INTEGER
);

CREATE TABLE "project_activities" (
  "id" SERIAL PRIMARY KEY,
  "projectId" INTEGER NOT NULL,
  "activityType" VARCHAR(50) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "metadata" TEXT,
  "createdBy" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "project_manufacturing" (
  "id" SERIAL PRIMARY KEY,
  "projectId" INTEGER NOT NULL,
  "processName" VARCHAR(255) NOT NULL,
  "processType" VARCHAR(100),
  "description" TEXT,
  "status" VARCHAR(50) DEFAULT 'pending',
  "workerId" INTEGER,
  "workerName" VARCHAR(255),
  "machineUsed" VARCHAR(255),
  "startTime" TIMESTAMP,
  "endTime" TIMESTAMP,
  "duration" INTEGER,
  "quantity" DECIMAL(18,3),
  "unit" VARCHAR(50),
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "project_materials" (
  "id" SERIAL PRIMARY KEY,
  "projectId" INTEGER NOT NULL,
  "materialId" INTEGER,
  "materialName" VARCHAR(255) NOT NULL,
  "materialType" VARCHAR(100),
  "quantity" DECIMAL(18,3) DEFAULT 0.000,
  "unit" VARCHAR(50),
  "unitCost" DECIMAL(18,2),
  "totalCost" DECIMAL(18,2),
  "status" VARCHAR(50) DEFAULT 'pending',
  "notes" TEXT,
  "addedAt" TIMESTAMP DEFAULT NOW(),
  "usedAt" TIMESTAMP
);

CREATE TABLE "project_payments" (
  "id" SERIAL PRIMARY KEY,
  "projectId" INTEGER NOT NULL,
  "invoiceId" INTEGER,
  "amount" DECIMAL(18,2) NOT NULL,
  "paymentMethod" VARCHAR(50),
  "paymentType" VARCHAR(50) DEFAULT 'incoming',
  "reference" VARCHAR(255),
  "bankName" VARCHAR(255),
  "transactionNumber" VARCHAR(255),
  "notes" TEXT,
  "paidAt" TIMESTAMP DEFAULT NOW(),
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "project_phases" (
  "id" SERIAL PRIMARY KEY,
  "projectId" INTEGER NOT NULL,
  "phaseName" VARCHAR(255) NOT NULL,
  "phaseOrder" INTEGER DEFAULT 0,
  "description" TEXT,
  "status" VARCHAR(50) DEFAULT 'pending',
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "wallets" (
  "id" SERIAL PRIMARY KEY,
  "ownerId" INTEGER NOT NULL,
  "name" VARCHAR(255) NOT NULL DEFAULT 'Personal Wallet',
  "balance" DECIMAL(18,2) DEFAULT 0.00,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "allowMainSafeWithdraw" BOOLEAN DEFAULT false
);

CREATE TABLE "wallet_transactions" (
  "id" SERIAL PRIMARY KEY,
  "walletId" INTEGER NOT NULL,
  "type" VARCHAR(255) NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "description" TEXT,
  "relatedSafeId" INTEGER,
  "relatedWalletId" INTEGER,
  "txRef" VARCHAR(255),
  "initiatedBy" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Inserts
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
('20251230120000-create-price-lists.js'),
('20251231120000-add-payment-fields-to-invoices.js'),
('20260102120000-add-paid-amount-to-invoices.js'),
('20260103120000-create-projects.js'),
('20260103121000-create-project-activities.js'),
('20260103122000-create-project-manufacturing.js'),
('20260103123000-create-project-materials.js'),
('20260103124000-create-project-payments.js'),
('20260103125000-create-project-phases.js'),
('20260104120000-create-client-attachments.js'),
('20260105120000-create-safes.js'),
('20260105121000-add-safe-columns-to-safe-entries.js'),
('20260106120000-add-ownerid-to-safes.js'),
('20260107120000-create-wallets-and-transactions.js'),
('20260109121000-add-allow-main-safe-withdraw-to-wallets.js'),
('20260109143000-create-wallets-v2.js'),
('20260110100000-create-material-items.js'),
('20260110120000-create-material-pieces.js'),
('20260110121000-add-materialpieceid-to-inventorytransactions.js'),
('20260206163000-add-count-weight-to-materials.js');

INSERT INTO "users" ("id", "name", "email", "password", "emailVerified", "createdAt", "updatedAt") VALUES
(27, 'Tester', 'test@gmail.com', '$2b$10$hbIAS965Gq16Z4TnWIlMdOcqw7Fkf2rumPhbTu/hIIsdXG15.h1q2', NULL, '2026-02-02 15:23:35', '2026-02-02 15:23:35'),
(28, 'ahmed tester', 'ahmed@test', '$2b$10$LvKIfXkuWOYLNDB3foqH.exNNvAUEaEhdkYlbApYylErNfS3bTcs6', NULL, '2026-02-02 15:29:27', '2026-02-02 15:29:27'),
(29, 'ahmed tdaester', 'qwe@qwe', '$2b$10$wOpRALdUgTgK9.ZOn9R/2efhPqNifDaHF.jXSeuL8KJeUg.ObjAgS', NULL, '2026-02-02 15:39:10', '2026-02-02 15:39:10');

INSERT INTO "safes" ("id", "name", "type", "isDefault", "createdAt", "updatedAt", "ownerId") VALUES (1, 'Main Safe', 'main', true, NOW(), NOW(), NULL);

INSERT INTO "materials" ("id", "name", "sku", "unit", "type", "stock", "createdBy", "materialName", "grade", "image", "createdAt", "updatedAt", "originalLength", "originalWidth") VALUES
(9, 'مبروم حديد 16mm', '-16MM-1770206438881', 'ton', 'factory', 9.00, 'test@gmail.com', 'black', 'other', NULL, '2026-02-04 12:00:39', '2026-02-04 12:15:10', 600.00, 16.00);

INSERT INTO "material_pieces" ("id", "materialId", "length", "width", "quantity", "isLeftover", "parentPieceId", "status", "createdAt", "updatedAt", "clientId") VALUES
(546, 9, 600.00, 16.00, 1.00, false, NULL, 'used', '2026-02-04 12:00:40', '2026-02-04 12:15:10', NULL),
(547, 9, 500.00, 10.00, 1.00, false, 546, 'dispatched', '2026-02-04 12:15:11', '2026-02-04 12:16:15', 27),
(548, 9, 100.00, 16.00, 1.00, true, 546, 'available', '2026-02-04 12:15:11', '2026-02-04 12:15:11', NULL),
(549, 9, 500.00, 6.00, 1.00, true, 546, 'reserved', '2026-02-04 12:15:12', '2026-02-04 12:31:49', NULL);

INSERT INTO "inventory_transactions" ("id", "materialId", "change", "action", "source", "reference", "user", "note", "createdAt", "updatedAt", "materialPieceId") VALUES
(644, 9, 10.00, 'add', 'supplier', '', 'test@gmail.com', 'Initial stock', '2026-02-04 12:00:40', '2026-02-04 12:00:40', NULL),
(645, 9, 1.00, 'add', 'initial_piece', '', 'test@gmail.com', NULL, '2026-02-04 12:00:41', '2026-02-04 12:00:41', 546),
(646, 9, -1.00, 'cut', 'order', 'cut from primary piece #546', 'test@gmail.com', NULL, '2026-02-04 12:15:10', '2026-02-04 12:15:10', 546),
(647, 9, 0.00, 'consume_leftover', 'order', 'cut 500x10 from piece 546', 'test@gmail.com', NULL, '2026-02-04 12:15:11', '2026-02-04 12:15:11', 547),
(648, 9, 0.00, 'cut_leftover', 'cut_remnant', 'leftover from 546', 'test@gmail.com', NULL, '2026-02-04 12:15:12', '2026-02-04 12:15:12', 548),
(649, 9, 0.00, 'cut_leftover', 'cut_remnant', 'leftover from 546', 'test@gmail.com', NULL, '2026-02-04 12:15:12', '2026-02-04 12:15:12', 549),
(650, 9, 0.00, 'permit', 'client', '27', 'test@gmail.com', 'token:permit-1770208309760-ujvswh • qty:1', '2026-02-04 12:31:50', '2026-02-04 12:31:50', 549);

INSERT INTO "wallets" ("id", "ownerId", "name", "balance", "createdAt", "updatedAt", "allowMainSafeWithdraw") VALUES
(36, 27, 'Personal Wallet', 0.00, '2026-02-02 15:23:35', '2026-02-02 15:23:35', false),
(37, 28, 'Personal Wallet', 0.00, '2026-02-02 15:29:27', '2026-02-02 15:29:27', false),
(38, 29, 'Personal Wallet', 0.00, '2026-02-02 15:39:11', '2026-02-02 15:39:11', false);

INSERT INTO "workers" ("id", "name", "email", "phone", "position", "department", "baseSalary", "hireDate", "status", "createdAt", "updatedAt") VALUES
('c991920d-7506-49b7-828e-1f31ea5477b8', 'احمد', '', '', 'عامل', '', 0.00, NULL, 'active', '2026-02-04 12:48:47', '2026-02-04 12:48:47');

-- Reset sequences
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM "users"));
SELECT setval(pg_get_serial_sequence('materials', 'id'), (SELECT MAX(id) FROM "materials"));
SELECT setval(pg_get_serial_sequence('material_pieces', 'id'), (SELECT MAX(id) FROM "material_pieces"));
SELECT setval(pg_get_serial_sequence('inventory_transactions', 'id'), (SELECT MAX(id) FROM "inventory_transactions"));
SELECT setval(pg_get_serial_sequence('wallets', 'id'), (SELECT MAX(id) FROM "wallets"));
SELECT setval(pg_get_serial_sequence('safes', 'id'), (SELECT MAX(id) FROM "safes"));

-- Indexes & Constraints

ALTER TABLE "attendance"
  ADD CONSTRAINT "attendance_unique_worker_date" UNIQUE ("workerId", "date");

ALTER TABLE "attendance"
  ADD CONSTRAINT "attendance_worker_fk" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "client_attachments"
  ADD CONSTRAINT "client_attachments_client_fk" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "daily_salaries"
  ADD CONSTRAINT "daily_salaries_unique_worker_date" UNIQUE ("workerId", "date");

ALTER TABLE "daily_salaries"
  ADD CONSTRAINT "daily_salaries_worker_fk" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "inventory_transactions"
  ADD CONSTRAINT "inventory_transactions_material_fk" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_client_fk" FOREIGN KEY ("clientId") REFERENCES "clients"("id");

ALTER TABLE "materials"
  ADD CONSTRAINT "materials_sku_unique" UNIQUE ("sku");

ALTER TABLE "material_items"
  ADD CONSTRAINT "material_items_material_fk" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "material_pieces"
  ADD CONSTRAINT "material_pieces_material_fk" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "material_pieces_parent_fk" FOREIGN KEY ("parentPieceId") REFERENCES "material_pieces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PasswordResets"
  ADD CONSTRAINT "PasswordResets_user_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "safes"
  ADD CONSTRAINT "safes_owner_fk" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "safe_entries"
  ADD CONSTRAINT "safe_entries_client_fk" FOREIGN KEY ("clientId") REFERENCES "clients"("id"),
  ADD CONSTRAINT "safe_entries_safe_fk" FOREIGN KEY ("safeId") REFERENCES "safes"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "safe_entries_target_safe_fk" FOREIGN KEY ("targetSafeId") REFERENCES "safes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "suppliers"
  ADD CONSTRAINT "suppliers_name_unique" UNIQUE ("name");

ALTER TABLE "UserRoles"
  ADD CONSTRAINT "UserRoles_user_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "UserRoles_role_fk" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE CASCADE;

ALTER TABLE "wallets"
  ADD CONSTRAINT "wallets_owner_fk" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wallet_transactions"
  ADD CONSTRAINT "wallet_transactions_wallet_fk" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX idx_attendance_workerid ON "attendance"("workerId");
CREATE INDEX idx_client_attachments_clientid ON "client_attachments"("clientId");
CREATE INDEX idx_inventory_transactions_materialid ON "inventory_transactions"("materialId");
CREATE INDEX idx_invoices_clientid ON "invoices"("clientId");
CREATE INDEX idx_invoices_projectid ON "invoices"("projectId");
CREATE INDEX idx_material_pieces_materialid ON "material_pieces"("materialId");
CREATE INDEX idx_material_pieces_status ON "material_pieces"("status");
CREATE INDEX idx_material_pieces_parentid ON "material_pieces"("parentPieceId");
CREATE INDEX idx_passwordresets_userid ON "PasswordResets"("userId");
CREATE INDEX idx_pricelists_clientid ON "price_lists"("clientId");
CREATE INDEX idx_pricelists_status ON "price_lists"("status");
CREATE INDEX idx_projects_clientid ON "projects"("clientId");
CREATE INDEX idx_projects_status ON "projects"("status");
CREATE INDEX idx_project_activities_projectid ON "project_activities"("projectId");
CREATE INDEX idx_project_manufacturing_projectid ON "project_manufacturing"("projectId");
CREATE INDEX idx_project_materials_projectid ON "project_materials"("projectId");
CREATE INDEX idx_project_payments_projectid ON "project_payments"("projectId");
CREATE INDEX idx_project_phases_projectid ON "project_phases"("projectId");
CREATE INDEX idx_safes_ownerid ON "safes"("ownerId");
CREATE INDEX idx_safe_entries_clientid ON "safe_entries"("clientId");
CREATE INDEX idx_safe_entries_safeid ON "safe_entries"("safeId");
CREATE INDEX idx_safe_entries_targetsafeid ON "safe_entries"("targetSafeId");
CREATE INDEX idx_userroles_userid ON "UserRoles"("userId");
CREATE INDEX idx_userroles_roleid ON "UserRoles"("roleId");
CREATE INDEX idx_wallets_ownerid ON "wallets"("ownerId");
CREATE INDEX idx_wallet_transactions_walletid ON "wallet_transactions"("walletId");
`;

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to Neon PostgreSQL...');
    await client.connect();
    console.log('Connected successfully!');

    console.log('Running migration...');
    await client.query(migrationSQL);
    console.log('Migration completed successfully!');

    // Verify tables were created
    const result = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

    console.log('\nTables created:');
    result.rows.forEach(row => {
      console.log('  - ' + row.table_name);
    });
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\nConnection closed.');
  }
}

runMigration();
