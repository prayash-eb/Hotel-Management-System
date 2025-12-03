import { registerAs } from '@nestjs/config';

export default registerAs('fileupload', () => ({
  allowedMimeTypes: ['image/jpeg', 'image/png'],
  maxSize: 2 * 1024 * 1024,
}));
