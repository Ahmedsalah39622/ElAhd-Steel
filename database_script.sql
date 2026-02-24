-- AHD Project - Complete Database Schema (PostgreSQL)
-- Generated on 2026-02-23

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CLEANUP
-- ─────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS "audit_logs";
DROP TABLE IF EXISTS "inventory_transactions";
DROP TABLE IF EXISTS "material_pieces";
DROP TABLE IF EXISTS "project_activities";
DROP TABLE IF EXISTS "project_materials";
DROP TABLE IF EXISTS "project_phases";
DROP TABLE IF EXISTS "project_payments";
DROP TABLE IF EXISTS "project_manufacturing";
DROP TABLE IF EXISTS "purchase_orders";
DROP TABLE IF EXISTS "safe_entries";
DROP TABLE IF EXISTS "wallet_transactions";
DROP TABLE IF EXISTS "wallets";
DROP TABLE IF EXISTS "safes";
DROP TABLE IF EXISTS "invoices";
DROP TABLE IF EXISTS "price_lists";
DROP TABLE IF EXISTS "projects";
DROP TABLE IF EXISTS "client_attachments";
DROP TABLE IF EXISTS "clients";
DROP TABLE IF EXISTS "suppliers";
DROP TABLE IF EXISTS "materials";
DROP TABLE IF EXISTS "MaterialCategories";
DROP TABLE IF EXISTS "MaterialGrades";
DROP TABLE IF EXISTS "MaterialUnits";
DROP TABLE IF EXISTS "daily_salaries";
DROP TABLE IF EXISTS "attendance";
DROP TABLE IF EXISTS "workers";
DROP TABLE IF EXISTS "user_roles";
DROP TABLE IF EXISTS "roles";
DROP TABLE IF EXISTS "users";
DROP TABLE IF EXISTS "password_resets";
DROP TABLE IF EXISTS "job_orders";

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CORE SYSTEM TABLES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255),
  "email" VARCHAR(255) UNIQUE,
  "password" VARCHAR(255),
  "emailVerified" TIMESTAMP WITH TIME ZONE,
  "visibleMenuItems" JSONB DEFAULT NULL,
  "allowedDashboardCards" JSONB DEFAULT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "roles" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255),
  "description" VARCHAR(255),
  "permissions" JSONB DEFAULT '[]',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "user_roles" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
  "roleId" INTEGER REFERENCES "roles"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. INVENTORY & MATERIALS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "MaterialCategories" (
  "id" SERIAL PRIMARY KEY,
  "value" VARCHAR(255) UNIQUE NOT NULL,
  "label" VARCHAR(255) NOT NULL,
  "isCustom" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "MaterialGrades" (
  "id" SERIAL PRIMARY KEY,
  "categoryValue" VARCHAR(255) NOT NULL,
  "value" VARCHAR(255) NOT NULL,
  "label" VARCHAR(255) NOT NULL,
  "isCustom" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "materials" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255),
  "sku" VARCHAR(255),
  "unit" VARCHAR(50),
  "type" VARCHAR(100),
  "stock" DECIMAL(18, 2) DEFAULT 0,
  "createdBy" VARCHAR(255),
  "materialName" VARCHAR(255), -- category
  "grade" VARCHAR(255),
  "image" VARCHAR(500),
  "originalLength" DECIMAL(18, 2),
  "originalWidth" DECIMAL(18, 2),
  "dimensionType" VARCHAR(20) DEFAULT 'rectangular',
  "thickness" DECIMAL(18, 2),
  "count" INTEGER DEFAULT 0,
  "weight" DECIMAL(18, 4) DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "material_pieces" (
  "id" SERIAL PRIMARY KEY,
  "materialId" INTEGER NOT NULL REFERENCES "materials"("id") ON DELETE CASCADE,
  "length" DECIMAL(18, 2),
  "width" DECIMAL(18, 2),
  "quantity" DECIMAL(18, 2) DEFAULT 1,
  "isLeftover" BOOLEAN DEFAULT FALSE,
  "parentPieceId" INTEGER REFERENCES "material_pieces"("id") ON DELETE SET NULL,
  "status" VARCHAR(50) DEFAULT 'available',
  "clientId" INTEGER, -- Reserved for client
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CLIENTS & SUPPLIERS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "clients" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(255),
  "profile" TEXT,
  "budget" DECIMAL(18, 2) DEFAULT 0,
  "material" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "client_attachments" (
  "id" SERIAL PRIMARY KEY,
  "clientId" INTEGER NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "category" VARCHAR(50) DEFAULT 'general',
  "fileName" VARCHAR(255) NOT NULL,
  "filePath" VARCHAR(500) NOT NULL,
  "fileSize" INTEGER,
  "mimeType" VARCHAR(100),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. PROJECTS & MANUFACTURING
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "projects" (
  "id" SERIAL PRIMARY KEY,
  "projectNumber" VARCHAR(50),
  "name" VARCHAR(255) NOT NULL,
  "clientId" INTEGER REFERENCES "clients"("id") ON DELETE SET NULL,
  "clientName" VARCHAR(255),
  "description" TEXT,
  "location" VARCHAR(255),
  "startDate" TIMESTAMP WITH TIME ZONE,
  "endDate" TIMESTAMP WITH TIME ZONE,
  "expectedDeliveryDate" TIMESTAMP WITH TIME ZONE,
  "actualDeliveryDate" TIMESTAMP WITH TIME ZONE,
  "status" VARCHAR(50) DEFAULT 'pending',
  "priority" VARCHAR(20) DEFAULT 'normal',
  "progressPercent" INTEGER DEFAULT 0,
  "totalCost" DECIMAL(18, 2),
  "totalRevenue" DECIMAL(18, 2),
  "notes" TEXT,
  "attachments" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "project_activities" (
  "id" SERIAL PRIMARY KEY,
  "projectId" INTEGER NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "activityType" VARCHAR(50) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "metadata" TEXT,
  "createdBy" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "project_materials" (
  "id" SERIAL PRIMARY KEY,
  "projectId" INTEGER NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "materialId" INTEGER REFERENCES "materials"("id") ON DELETE SET NULL,
  "materialName" VARCHAR(255) NOT NULL,
  "materialType" VARCHAR(100),
  "quantity" DECIMAL(18, 3) NOT NULL DEFAULT 0,
  "unit" VARCHAR(50),
  "unitCost" DECIMAL(18, 2),
  "totalCost" DECIMAL(18, 2),
  "status" VARCHAR(50) DEFAULT 'pending',
  "notes" TEXT,
  "addedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "usedAt" TIMESTAMP WITH TIME ZONE
);

CREATE TABLE "job_orders" (
  "id" SERIAL PRIMARY KEY,
  "orderNumber" VARCHAR(255) UNIQUE NOT NULL,
  "clientName" VARCHAR(255),
  "projectCode" VARCHAR(255),
  "status" VARCHAR(50) DEFAULT 'pending',
  "specifications" JSONB,
  "calculations" JSONB,
  "accessories" JSONB,
  "engineeringDrawing" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "inventory_transactions" (
  "id" SERIAL PRIMARY KEY,
  "materialId" INTEGER REFERENCES "materials"("id") ON DELETE CASCADE,
  "materialPieceId" INTEGER REFERENCES "material_pieces"("id") ON DELETE SET NULL,
  "change" DECIMAL(18, 2) NOT NULL,
  "action" VARCHAR(50),
  "source" VARCHAR(100),
  "reference" VARCHAR(255),
  "user" VARCHAR(255),
  "note" TEXT,
  "jobOrderId" INTEGER REFERENCES "job_orders"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. FINANCE: SAFES & WALLETS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "safes" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "type" VARCHAR(100),
  "isDefault" BOOLEAN DEFAULT FALSE,
  "ownerId" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "invoices" (
  "id" SERIAL PRIMARY KEY,
  "number" VARCHAR(255),
  "clientId" INTEGER REFERENCES "clients"("id") ON DELETE SET NULL,
  "projectId" INTEGER REFERENCES "projects"("id") ON DELETE SET NULL,
  "date" TIMESTAMP WITH TIME ZONE,
  "dueDate" TIMESTAMP WITH TIME ZONE,
  "items" TEXT,
  "manufacturing" TEXT,
  "taxPercent" DECIMAL(5, 2),
  "taxAmount" DECIMAL(18, 2),
  "discount" DECIMAL(18, 2),
  "total" DECIMAL(18, 2),
  "status" VARCHAR(50),
  "paidAmount" DECIMAL(18, 2),
  "notes" TEXT,
  "paymentMethod" VARCHAR(100),
  "bankName" VARCHAR(255),
  "transactionNumber" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "safe_entries" (
  "id" SERIAL PRIMARY KEY,
  "month" VARCHAR(20),
  "date" TIMESTAMP WITH TIME ZONE,
  "description" TEXT,
  "project" VARCHAR(255),
  "customer" VARCHAR(255),
  "incoming" DECIMAL(18, 2) DEFAULT 0,
  "outgoing" DECIMAL(18, 2) DEFAULT 0,
  "incomingMethod" VARCHAR(100),
  "outgoingMethod" VARCHAR(100),
  "incomingTxn" VARCHAR(255),
  "outgoingTxn" VARCHAR(255),
  "balance" DECIMAL(18, 2) DEFAULT 0,
  "safeId" INTEGER REFERENCES "safes"("id") ON DELETE CASCADE,
  "targetSafeId" INTEGER REFERENCES "safes"("id") ON DELETE CASCADE,
  "clientId" INTEGER REFERENCES "clients"("id") ON DELETE SET NULL,
  "supplierId" INTEGER REFERENCES "suppliers"("id") ON DELETE SET NULL,
  "entryType" VARCHAR(50), -- 'incoming' | 'outgoing' | 'transfer'
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "wallets" (
  "id" SERIAL PRIMARY KEY,
  "ownerId" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
  "name" VARCHAR(255),
  "balance" DECIMAL(18, 2) DEFAULT 0,
  "allowMainSafeWithdraw" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "wallet_transactions" (
  "id" SERIAL PRIMARY KEY,
  "walletId" INTEGER REFERENCES "wallets"("id") ON DELETE CASCADE,
  "type" VARCHAR(50),
  "amount" DECIMAL(18, 2) NOT NULL,
  "description" TEXT,
  "relatedSafeId" INTEGER REFERENCES "safes"("id") ON DELETE SET NULL,
  "relatedWalletId" INTEGER REFERENCES "wallets"("id") ON DELETE SET NULL,
  "txRef" VARCHAR(255),
  "initiatedBy" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "purchase_orders" (
  "id" SERIAL PRIMARY KEY,
  "orderNumber" VARCHAR(255) UNIQUE NOT NULL,
  "supplierId" INTEGER NOT NULL REFERENCES "suppliers"("id"),
  "materialId" INTEGER NOT NULL REFERENCES "materials"("id"),
  "weight" DECIMAL(10, 2),
  "price" DECIMAL(10, 2) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "recipient" VARCHAR(255) DEFAULT 'المستودع',
  "paymentMethod" VARCHAR(50) DEFAULT 'cash',
  "transactionNumber" VARCHAR(255),
  "totalAmount" DECIMAL(10, 2) NOT NULL,
  "status" VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  "notes" TEXT,
  "paymentStatus" VARCHAR(20) DEFAULT 'paid', -- 'paid', 'credit', 'partial'
  "paidAmount" DECIMAL(10, 2) DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. HR & SALARIES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "workers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) UNIQUE,
  "phone" VARCHAR(255),
  "position" VARCHAR(255),
  "department" VARCHAR(255),
  "baseSalary" DECIMAL(10, 2) DEFAULT 0,
  "hireDate" TIMESTAMP WITH TIME ZONE,
  "status" VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'on-leave'
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "attendance" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workerId" UUID NOT NULL REFERENCES "workers"("id") ON DELETE CASCADE,
  "date" TIMESTAMP WITH TIME ZONE NOT NULL,
  "status" VARCHAR(20) DEFAULT 'present', -- 'present', 'absent', 'half-day', 'leave'
  "checkInTime" TIME,
  "checkOutTime" TIME,
  "checkInDevice" VARCHAR(255),
  "checkOutDevice" VARCHAR(255),
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("workerId", "date")
);

CREATE TABLE "daily_salaries" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workerId" UUID NOT NULL REFERENCES "workers"("id") ON DELETE CASCADE,
  "date" TIMESTAMP WITH TIME ZONE NOT NULL,
  "dailyAmount" DECIMAL(10, 2) DEFAULT 0,
  "bonus" DECIMAL(10, 2) DEFAULT 0,
  "deduction" DECIMAL(10, 2) DEFAULT 0,
  "totalAmount" DECIMAL(10, 2) DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("workerId", "date")
);

CREATE TABLE "project_manufacturing" (
  "id" SERIAL PRIMARY KEY,
  "projectId" INTEGER NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "processName" VARCHAR(255) NOT NULL,
  "processType" VARCHAR(100),
  "description" TEXT,
  "status" VARCHAR(50) DEFAULT 'pending',
  "workerId" UUID REFERENCES "workers"("id") ON DELETE SET NULL, -- Worker IDs are UUID
  "workerName" VARCHAR(255),
  "machineUsed" VARCHAR(255),
  "startTime" TIMESTAMP WITH TIME ZONE,
  "endTime" TIMESTAMP WITH TIME ZONE,
  "duration" INTEGER,
  "quantity" DECIMAL(18, 3),
  "unit" VARCHAR(50),
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. EXTRA TOOLS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "price_lists" (
  "id" SERIAL PRIMARY KEY,
  "clientId" INTEGER REFERENCES "clients"("id") ON DELETE SET NULL,
  "clientName" VARCHAR(255),
  "projectName" VARCHAR(255),
  "projectDescription" TEXT,
  "items" TEXT, -- JSON string
  "manufacturingItems" TEXT, -- JSON string
  "notes" TEXT,
  "validUntil" TIMESTAMP WITH TIME ZONE,
  "status" VARCHAR(50) DEFAULT 'draft',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "audit_logs" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "action" VARCHAR(255),
  "details" TEXT,
  "ipAddress" VARCHAR(100),
  "userAgent" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "project_phases" (
  "id" SERIAL PRIMARY KEY,
  "projectId" INTEGER NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "phaseName" VARCHAR(255) NOT NULL,
  "phaseOrder" INTEGER DEFAULT 0,
  "description" TEXT,
  "status" VARCHAR(50) DEFAULT 'pending',
  "startDate" TIMESTAMP WITH TIME ZONE,
  "endDate" TIMESTAMP WITH TIME ZONE,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "project_payments" (
  "id" SERIAL PRIMARY KEY,
  "projectId" INTEGER NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "invoiceId" INTEGER REFERENCES "invoices"("id") ON DELETE SET NULL,
  "amount" DECIMAL(18, 2) NOT NULL,
  "paymentMethod" VARCHAR(50),
  "paymentType" VARCHAR(50) DEFAULT 'incoming',
  "reference" VARCHAR(255),
  "bankName" VARCHAR(255),
  "transactionNumber" VARCHAR(255),
  "notes" TEXT,
  "paidAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. INDICES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX idx_materials_sku ON "materials"("sku");
CREATE INDEX idx_inventory_material ON "inventory_transactions"("materialId");
CREATE INDEX idx_invoices_client ON "invoices"("clientId");
CREATE INDEX idx_projects_client ON "projects"("clientId");
CREATE INDEX idx_safe_entries_safe ON "safe_entries"("safeId");
CREATE INDEX idx_attendance_worker_date ON "attendance"("workerId", "date");
