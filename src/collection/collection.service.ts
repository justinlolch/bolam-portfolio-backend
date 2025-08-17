import {Injectable, Logger, NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {CreateCollectionDto} from './dto/create-collection.dto';
import {AddMediaDto} from './dto/add-media.dto';
import {UpdateCollectionDto} from "./dto/update-collection.dto";

@Injectable()
export class CollectionService {
    private readonly logger = new Logger(CollectionService.name);

    constructor(private prisma: PrismaService) {
    }

    async create(dto: CreateCollectionDto) {
        this.logger.log(`Creating collection with name: "${dto.name}"`);

        // Get the current highest sequence number
        const lastCollection = await this.prisma.collection.findFirst({
            orderBy: { sequence: 'desc' },
            select: { sequence: true },
        });

        const nextSequence = (lastCollection?.sequence ?? 0) + 1;

        const collection = await this.prisma.collection.create({
            data: {
                name: dto.name,
                title: dto.title,
                sequence: nextSequence,
                coverImage: dto.coverImageId
                    ? { connect: { id: dto.coverImageId } }
                    : undefined,
            },
            include: { coverImage: true },
        });

        this.logger.log(`Collection created: ${collection.id} (sequence: ${nextSequence})`);
        return collection;
    }

    async addMedia(collectionId: string, dto: AddMediaDto) {
        this.logger.log(`Adding media ${dto.mediaFileId} to collection ${collectionId} at sequence ${dto.sequence}`);

        const exists = await this.prisma.collection.findUnique({
            where: {id: collectionId},
        });

        if (!exists) {
            this.logger.warn(`Collection not found: ${collectionId}`);
            throw new NotFoundException('Collection not found');
        }

        const link = await this.prisma.mediaCollection.create({
            data: {
                collection: {connect: {id: collectionId}},
                mediaFile: {connect: {id: dto.mediaFileId}},
                sequence: dto.sequence,
            },
        });

        this.logger.log(`Media ${dto.mediaFileId} added to collection ${collectionId}`);
        return link;
    }

    async findOne(id: string) {
        this.logger.log(`Fetching collection: ${id}`);

        const collection = await this.prisma.collection.findUnique({
            where: {id},
            include: {
                coverImage: true,
                media: {
                    orderBy: {sequence: 'asc'},
                    include: {mediaFile: true},
                },
            },
        });

        if (!collection) {
            this.logger.warn(`Collection not found: ${id}`);
            throw new NotFoundException('Collection not found');
        }

        this.logger.log(`Collection ${id} fetched successfully`);
        return {
            ...collection,
            media: collection.media.map((m) => m.mediaFile),
        };
    }

    async remove(id: string) {
        this.logger.log(`Deleting collection: ${id}`);

        const deleted = await this.prisma.collection.delete({where: {id}});

        this.logger.log(`Collection deleted: ${id}`);
        return deleted;
    }

    async getCollectionList() {
        this.logger.log('Fetching all collections');

        return this.prisma.collection.findMany({
            orderBy: {sequence: 'asc'},
            select: {
                id: true,
                name: true,
                title: true,
                coverImage: true,
            },
        });
    }

    async updateMediaOrder(collectionId: string, mediaIds: string[]) {
        this.logger.log(`Updating order for ${mediaIds.length} items in ${collectionId}`);

        const updates = mediaIds.map((mediaFileId, index) =>
            this.prisma.mediaCollection.updateMany({
                where: {
                    collectionId,
                    mediaFileId,
                },
                data: {
                    sequence: index,
                },
            })
        );

        await this.prisma.$transaction(updates);
        return {message: 'Media order updated'};
    }

    async update(id: string, dto: UpdateCollectionDto) {
        this.logger.log(`Updating collection ${id} with data: ${JSON.stringify(dto)}`);

        return this.prisma.collection.update({
            where: {id},
            data: {
                name: dto.name,
                title: dto.title,
                coverImage: dto.coverImageId
                    ? {connect: {id: dto.coverImageId}}
                    : dto.coverImageId === null
                        ? {disconnect: true}
                        : undefined,
            },
            include: {coverImage: true},
        });
    }
}