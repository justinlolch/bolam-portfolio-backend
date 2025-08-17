import {Body, Controller, Delete, Get, Inject, Logger, Param, Patch, Post, Put} from '@nestjs/common';
import {CollectionService} from './collection.service';
import {CreateCollectionDto} from './dto/create-collection.dto';
import {UpdateCollectionDto} from "./dto/update-collection.dto";
import {AddMediaDto} from './dto/add-media.dto';
import {ApiTags} from '@nestjs/swagger';

@ApiTags('Collection')
@Controller('collection')
export class CollectionController {
    private readonly logger = new Logger(CollectionController.name);

    constructor(private readonly collectionService: CollectionService) {
    }

    @Post()
    async create(@Body() dto: CreateCollectionDto) {
        this.logger.log(`Received request to create collection: ${dto.name}`);
        return this.collectionService.create(dto);
    }

    @Post(':id/media')
    async addMedia(@Param('id') id: string, @Body() dto: AddMediaDto) {
        this.logger.log(`Received request to add media to collection ${id}`);
        return this.collectionService.addMedia(id, dto);
    }

    @Get('list')
    async getCollectionList() {
        this.logger.log(`Received request to get collection list`);
        return this.collectionService.getCollectionList();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        this.logger.log(`Received request to fetch collection ${id}`);
        return this.collectionService.findOne(id);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        this.logger.log(`Received request to delete collection ${id}`);
        return this.collectionService.remove(id);
    }

    @Patch(':id/media/order')
    async updateMediaOrder(
        @Param('id') collectionId: string,
        @Body() body: { mediaIds: string[] }
    ) {
        this.logger.log(`Updating order for collection ${collectionId}`);
        return this.collectionService.updateMediaOrder(collectionId, body.mediaIds);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateCollectionDto,
    ) {
        this.logger.log(`Received request to update collection ${id}`);
        return this.collectionService.update(id, dto);
    }
}