-- AlterTable
ALTER TABLE `vehicle_entry_logs` ADD COLUMN `vehicleType` ENUM('ELEC', 'GAS') NOT NULL DEFAULT 'GAS';
