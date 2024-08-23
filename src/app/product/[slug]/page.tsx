import { notFound } from 'next/navigation';
import { products } from '@/data/products';
import ProductPage from './ProductPage';

export async function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export default function Page({ params }: { params: { slug: string } }) {
  const product = products.find((p) => p.slug === params.slug);

  if (!product) {
    notFound();
  }

  return <ProductPage product={product} />;
}