import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  /** Заглушка. Phase 1: фасетний пошук за CatalogQuery через Typesense. */
  @Get('products')
  list() {
    return { items: [], total: 0, note: 'Phase 1: реалізація каталогу' };
  }
}
