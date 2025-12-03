import { Transform } from 'class-transformer';
import { Types } from 'mongoose';

/**
 * Decorator to transform string ID to ObjectId
 * Use with @IsMongoId() for validation (place @ToObjectId() first/above)
 */
export const ToObjectId = () => {
  return Transform(({ value }) => {
    if (value instanceof Types.ObjectId) {
      return value;
    }
    if (typeof value === 'string' && Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }
    return value; // Return as-is, let validation catch invalid values
  });
};
