import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Product } from '@voltstar/types';
import { fetchProducts, formatPrice } from '../../../lib/api';

export const dynamic = 'force-dynamic';

export default async function CatalogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('catalog');

  let products: Product[] = [];
  try {
    const res = await fetchProducts({ perPage: '24' });
    products = res.items;
  } catch {
    products = [];
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <Link href={`/${locale}`} className="text-sm text-neutral-500 hover:underline">
        VOLTSTAR
      </Link>
      <h1 className="mt-2 mb-8 text-3xl font-bold">{t('title')}</h1>

      {products.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-neutral-500">
          {t('empty')}
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const price = p.prices[0];
            return (
              <Link
                key={p.id}
                href={`/${locale}/catalog/${p.slug}`}
                className="flex flex-col rounded-xl border border-neutral-200 p-5 transition-shadow hover:shadow-md"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  {p.brand}
                </span>
                <span className="mt-1 text-lg font-semibold">{p.name}</span>
                <span className="mt-2 text-sm text-neutral-600">
                  {t('power')}: {(p.ratedPowerW / 1000).toFixed(1)} кВт · {t('fuel')}: {p.fuel}
                </span>
                <span className="mt-3 text-sm">
                  {p.inStock ? (
                    <span className="text-green-600">{t('inStock')}</span>
                  ) : (
                    <span className="text-neutral-400">{t('outOfStock')}</span>
                  )}
                </span>
                {price && (
                  <span className="mt-3 text-lg font-bold text-brand-dark">
                    {t('from')} {formatPrice(price.amountMinor, price.currency, `${locale}-UA`)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
