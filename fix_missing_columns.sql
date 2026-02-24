-- SQL Migration Script to resolve missing projectId columns
-- Run this on your database to restore full project-linking functionality

-- 1. Add projectId to invoices
ALTER TABLE `invoices` ADD COLUMN IF NOT EXISTS `projectId` INTEGER DEFAULT NULL;

-- 2. Add projectId to project_activities (if missing)
ALTER TABLE `project_activities` ADD COLUMN IF NOT EXISTS `projectId` INTEGER DEFAULT NULL;

-- 3. Add projectId to project_materials (if missing)
ALTER TABLE `project_materials` ADD COLUMN IF NOT EXISTS `projectId` INTEGER DEFAULT NULL;

-- 4. Add projectId to project_phases (if missing)
ALTER TABLE `project_phases` ADD COLUMN IF NOT EXISTS `projectId` INTEGER DEFAULT NULL;

-- 5. Add projectId to project_payments (if missing)
ALTER TABLE `project_payments` ADD COLUMN IF NOT EXISTS `projectId` INTEGER DEFAULT NULL;

-- 6. Add projectId to project_manufacturing (if missing)
ALTER TABLE `project_manufacturing` ADD COLUMN IF NOT EXISTS `projectId` INTEGER DEFAULT NULL;

-- 7. Ensure purchase_orders table exists
CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `supplierId` INTEGER DEFAULT NULL,
  `projectId` INTEGER DEFAULT NULL,
  `total` DECIMAL(10,2) DEFAULT 0,
  `status` VARCHAR(50) DEFAULT 'pending',
  `date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP
);
