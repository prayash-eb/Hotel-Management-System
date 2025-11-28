import { Injectable } from "@nestjs/common";
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
import * as streamifier from 'streamifier'

@Injectable()
export class CloudinaryService {
    constructor() {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_KEY,
            api_secret: process.env.CLOUDINARY_SECRET,
        })
    }

    uploadImage(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
        return new Promise((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                { folder: 'profiles' },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result!);
                },
            );
            streamifier.createReadStream(file.buffer).pipe(upload)
        })
    }
}