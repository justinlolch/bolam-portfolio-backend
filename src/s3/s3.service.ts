import {ForbiddenException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import * as AWS from 'aws-sdk';
import {PrismaService} from "../prisma/prisma.service";

@Injectable()
export class S3Service {
    private s3: AWS.S3;
    private bucket: string;
    private readonly logger = new Logger(S3Service.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        const accessKeyId = this.configService.get<string>('ACCESS_KEY_ID');
        this.s3 = new AWS.S3({
            accessKeyId: this.configService.get<string>('ACCESS_KEY_ID'),
            secretAccessKey: this.configService.get<string>('SECRET_ACCESS_KEY'),
            region: this.configService.get<string>('REGION'),
        });

        const bucket = this.configService.get<string>('AWS_S3_BUCKET_NAME');
        if (!bucket) {
            throw new Error('Missing AWS_S3_BUCKET_NAME in environment');
        }

        this.bucket = bucket;
    }

    async uploadFile(file: Express.Multer.File, type: string) {
        const prefix = type ? `${type}/` : '';
        const key = `${prefix}${Date.now()}-${file.originalname}`;
        const contentType = file.mimetype;

        const uploadResult = await this.uploadObject(this.bucket, key, file.buffer, contentType);

        const saved = await this.prisma.mediaFile.create({
            data: {
                key,
                url: uploadResult.Location,
                filename: file.originalname,
            },
        });

        return saved;
    }

    async uploadMultipleFiles(files: Express.Multer.File[], type: string) {
        const prefix = type ? `${type}/` : '';

        const uploads = await Promise.all(
            files.map(async (file) => {
                const key = `${prefix}${Date.now()}-${file.originalname}`;
                const contentType = file.mimetype;

                const uploadResult = await this.uploadObject(this.bucket, key, file.buffer, contentType);

                return this.prisma.mediaFile.create({
                    data: {
                        key,
                        url: uploadResult.Location,
                        filename: file.originalname,
                    },
                });
            }),
        );

        return uploads;
    }

    async uploadObject(
        bucketName: string,
        key: string,
        fileContent: Buffer,
        contentType: string,
    ): Promise<AWS.S3.ManagedUpload.SendData> {
        return await this.s3
            .upload({
                Bucket: bucketName,
                Key: key,
                Body: fileContent,
                ContentType: contentType,
            })
            .promise();
    }

    async deleteMedia(mediaId: string) {
        const file = await this.prisma.mediaFile.findUnique({
            where: {id: mediaId},
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        await this.s3
            .deleteObject({
                Bucket: this.bucket!,
                Key: file.key,
            })
            .promise();

        await this.prisma.mediaFile.delete({
            where: {id: mediaId},
        });

        return {message: 'File deleted successfully', id: mediaId};
    }
}