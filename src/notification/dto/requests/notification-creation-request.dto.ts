import { NotificationType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsString,
} from 'class-validator';

export class NotificationCreationRequestDto {
  @IsArray({ message: 'receiverIds must be an array' })
  @ArrayNotEmpty({ message: 'receiverIds cannot be empty' })
  @IsInt({ each: true, message: 'each receiverId must be an integer' })
  @Type(() => Number)
  receiverIds: number[];
  @IsString({
    message: 'title must be a string',
  })
  title: string;
  @IsString({
    message: 'message must be a string',
  })
  message: string;
  @Transform(({ value }) =>
    value ? String(value).replace(' ', '_').toUpperCase() : undefined,
  )
  @IsEnum(NotificationType, {
    message: 'type must be a valid notifcation type',
  })
  type: NotificationType;
}
