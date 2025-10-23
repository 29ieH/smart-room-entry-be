-- CreateTable
CREATE TABLE `vehicles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `brand` VARCHAR(191) NOT NULL,
    `chassisNumber` VARCHAR(191) NOT NULL,
    `engineNumber` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `registeredDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('ACTIVE', 'INACTIVE', 'STOLEN') NOT NULL DEFAULT 'ACTIVE',
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vehicles_chassisNumber_key`(`chassisNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `license_plates` (
    `licensePlateNumber` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'REGISTERED', 'REVOKED', 'LOST', 'STOLEN', 'EXPIRED') NOT NULL DEFAULT 'REGISTERED',
    `registeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`licensePlateNumber`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle_license_plates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicleId` INTEGER NOT NULL,
    `licensePlateNumber` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'INACTIVE', 'REVOKED', 'TRANSFERRED', 'LOST') NOT NULL DEFAULT 'ACTIVE',
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `vehicle_license_plates_licensePlateNumber_idx`(`licensePlateNumber`),
    UNIQUE INDEX `vehicle_license_plates_vehicleId_licensePlateNumber_key`(`vehicleId`, `licensePlateNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_vehicle_license_plates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `vehicleLicensePlateId` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'INACTIVE', 'EXPIRED', 'BLACKLISTED') NOT NULL DEFAULT 'ACTIVE',
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `room_vehicle_license_plates_roomId_vehicleLicensePlateId_key`(`roomId`, `vehicleLicensePlateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle_entry_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `licensePlateNumber` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NOT NULL,
    `chassisNumber` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `direction` ENUM('IN', 'OUT') NOT NULL,
    `note` VARCHAR(191) NULL,
    `logDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vehicle_license_plates` ADD CONSTRAINT `vehicle_license_plates_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle_license_plates` ADD CONSTRAINT `vehicle_license_plates_licensePlateNumber_fkey` FOREIGN KEY (`licensePlateNumber`) REFERENCES `license_plates`(`licensePlateNumber`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle_entry_logs` ADD CONSTRAINT `vehicle_entry_logs_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
