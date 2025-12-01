import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable({ scope: Scope.REQUEST })
export class FileValidationPipe implements PipeTransform {
    constructor(
        private readonly configService: ConfigService
    ) { }

    transform(value: Express.Multer.File | Express.Multer.File[], metadata: ArgumentMetadata) {
        if (!value) {
            return value;
        }

        if (Array.isArray(value)) {
            value.forEach(file => this.validateFile(file));
            return value;
        }

        return this.validateFile(value);
    }

    private validateFile(file: Express.Multer.File) {
        const errors: string[] = [];
        const fileUploadConfig = this.configService.get("fileupload")

        const allowedMimeTypes: string[] = fileUploadConfig.allowedMimeTypes
        const maxFileSize: number = fileUploadConfig.maxSize

        if (!allowedMimeTypes.includes(file.mimetype)) {
            errors.push(`Invalid File Type. Allowed ${allowedMimeTypes.join(', ')}`)
        }
        if (file.size > maxFileSize) {
            errors.push(`File size limit exceeded. Max Allowed Limit: ${maxFileSize / (1024 * 1024)}MB`)
        }
        // If any errors → throw exception
        if (errors.length > 0) {
            throw new BadRequestException({
                message: 'File validation failed',
                errors,
            });
        }

        return file
    }
}