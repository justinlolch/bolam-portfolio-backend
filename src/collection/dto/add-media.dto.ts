import { IsUUID, IsInt, Min } from 'class-validator';

export class AddMediaDto {
    @IsUUID()
    mediaFileId: string;

    @IsInt()
    @Min(0)
    sequence: number;
}