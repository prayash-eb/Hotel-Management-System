import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * Converts a string to MongoDB ObjectId
 * @param id - The string ID to convert
 * @param fieldName - Optional field name for better error messages
 * @returns Types.ObjectId
 * @throws BadRequestException if the ID is invalid
 */
export function toObjectId(id: string, fieldName: string = 'ID'): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException(`Invalid ${fieldName}: ${id}`);
  }
  return new Types.ObjectId(id);
}

/**
 * Converts multiple string IDs to MongoDB ObjectIds
 * @param ids - Array of string IDs to convert
 * @param fieldName - Optional field name for better error messages
 * @returns Array of Types.ObjectId
 * @throws BadRequestException if any ID is invalid
 */
export function toObjectIds(ids: string[], fieldName: string = 'ID'): Types.ObjectId[] {
  return ids.map((id, index) => {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${fieldName} at index ${index}: ${id}`);
    }
    return new Types.ObjectId(id);
  });
}
