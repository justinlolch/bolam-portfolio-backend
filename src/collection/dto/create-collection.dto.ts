import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCollectionDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsUUID()
    coverImageId?: string;
}