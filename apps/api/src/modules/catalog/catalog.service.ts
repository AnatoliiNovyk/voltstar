import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { CatalogQuery, Product, Segment } from '@voltstar/types';
import { PrismaService } from '../../prisma/prisma.service';

const productInclude = {
  brand: true,
  category: true,
  specs: true,
  inventory: true,
  prices: { include: { priceList: true } },
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /** Список товарів із фільтрами та пагінацією. Ціни — для вказаного сегмента. */
  async list(
    query: CatalogQuery,
    segment: Segment = 'B2C',
  ): Promise<{ items: Product[]; total: number; page: number; perPage: number }> {
    const where: Prisma.ProductWhereInput = {};

    if (query.q) where.name = { contains: query.q, mode: 'insensitive' };
    if (query.brand?.length) where.brand = { is: { slug: { in: query.brand } } };
    if (query.fuel?.length) where.fuel = { in: query.fuel };
    if (query.phase) where.phase = query.phase;
    if (query.minPowerW != null || query.maxPowerW != null) {
      where.ratedPowerW = {
        ...(query.minPowerW != null ? { gte: query.minPowerW } : {}),
        ...(query.maxPowerW != null ? { lte: query.maxPowerW } : {}),
      };
    }
    if (query.inStock) where.inventory = { is: { quantity: { gt: 0 } } };

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { ratedPowerW: 'asc' },
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: rows.map((r) => this.toDto(r, segment)),
      total,
      page: query.page,
      perPage: query.perPage,
    };
  }

  async getBySlug(slug: string, segment: Segment = 'B2C'): Promise<Product> {
    const row = await this.prisma.product.findUnique({ where: { slug }, include: productInclude });
    if (!row) throw new NotFoundException(`Товар "${slug}" не знайдено`);
    return this.toDto(row, segment);
  }

  /** Prisma-модель → публічний DTO з цінами для сегмента. */
  private toDto(row: ProductWithRelations, segment: Segment): Product {
    const prices = row.prices
      .filter((p) => p.priceList.segment === segment)
      .map((p) => ({
        segment: p.priceList.segment as Segment,
        currency: p.priceList.currency,
        amountMinor: p.amountMinor,
        vatRate: p.vatRate,
      }));

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      brand: row.brand.name,
      categorySlug: row.category.slug,
      fuel: row.fuel,
      phase: row.phase,
      ratedPowerW: row.ratedPowerW,
      maxPowerW: row.maxPowerW,
      images: row.images,
      inStock: (row.inventory?.quantity ?? 0) > 0,
      prices,
    };
  }
}
