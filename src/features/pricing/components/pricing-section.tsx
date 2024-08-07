import Image from 'next/image';

import { PricingCard } from '@/features/pricing/components/price-card';
import { getProducts } from '@/features/pricing/controllers/get-products';

import { createCheckoutAction } from '../actions/create-checkout-action';

export async function PricingSection({ isPricingPage }: { isPricingPage?: boolean }) {
  const products = await getProducts();

  const HeadingLevel = isPricingPage ? 'h1' : 'h2';

  return (
    <section className='relative rounded-lg bg-[#E8E4DB] py-8'>
      <div className='relative z-10 m-auto flex max-w-[1200px] flex-col items-center gap-8 px-4 pt-8 lg:pt-[140px]'>
        <HeadingLevel className='max-w-4xl text-center text-4xl font-bold text-[#3C3C3C] lg:text-6xl font-man'>
          Predictable pricing for every use case.
        </HeadingLevel>
        <p className='text-center text-xl font-ibm text-[#3C3C3C]'>
          Find a plan that fits you. Upgrade at any time to enable additional features.
        </p>
        <div className='flex w-full flex-col items-center justify-center gap-2 lg:flex-row lg:gap-8'>
          {products.map((product) => {
            return <PricingCard key={product.id} product={product} createCheckoutAction={createCheckoutAction} />;
          })}
        </div>
      </div>
    </section>
  );
}