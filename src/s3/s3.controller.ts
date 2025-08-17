import {
    Controller, Delete, Logger, Param,
    Post, Query,
    UploadedFile, UploadedFiles,
    UseInterceptors,
} from '@nestjs/common';
import {FileInterceptor, FilesInterceptor} from '@nestjs/platform-express';
import {S3Service} from './s3.service';
import {Express} from 'express';
import {ConfigService} from "@nestjs/config";
import {ApiBody, ApiConsumes, ApiTags} from "@nestjs/swagger";

@ApiTags('S3')
@Controller('s3')
export class S3Controller {
    private readonly logger = new Logger(S3Controller.name);

    constructor(
        private readonly s3Service: S3Service,
        private readonly configService: ConfigService
    ) {}

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                type: { type: 'string' },
            },
        },
    })
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Query('type') type: string,
    ) {
        this.logger.log(`Received upload file ${file.originalname} with type=${type}`);
        return this.s3Service.uploadFile(file, type);
    }

    @Post('multi')
    @UseInterceptors(FilesInterceptor('files'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
                type: { type: 'string' },
            },
        },
    })
    async uploadMultipleFiles(
        @UploadedFiles() files: Express.Multer.File[],
        @Query('type') type: string,
    ) {
        this.logger.log(`Received ${files.length} files for upload with type=${type}`);
        return this.s3Service.uploadMultipleFiles(files, type);
    }

    @Delete(':mediaId')
    async deleteFile(@Param('mediaId') mediaId: string) {
        this.logger.log(`Deleting file with mediaId: ${mediaId}`);
        return this.s3Service.deleteMedia(mediaId);
    }
}