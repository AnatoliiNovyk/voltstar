import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';

// Phase 1: CRUD каталогу, Typesense-індексація, фасетні фільтри.
@Module({
  controllers: [CatalogController],
})
export class CatalogModule {}
