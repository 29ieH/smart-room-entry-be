-- AddForeignKey
ALTER TABLE `room_vehicle_license_plates` ADD CONSTRAINT `room_vehicle_license_plates_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_vehicle_license_plates` ADD CONSTRAINT `room_vehicle_license_plates_vehicleLicensePlateId_fkey` FOREIGN KEY (`vehicleLicensePlateId`) REFERENCES `vehicle_license_plates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
