'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { IoCheckmark } from 'react-icons/io5';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { PriceCardVariant, productMetadataSchema } from '../models/product-metadata';
import { BillingInterval, Price, ProductWithPrices } from '../types';

export function PricingCard({
  product,
  price,
  createCheckoutAction,
}: {
  product: ProductWithPrices;
  price?: Price;
  createCheckoutAction?: ({ price }: { price: Price }) => void;
}) {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(
    price ? (price.interval as BillingInterval) : 'month'
  );

  // Determine the price to render
  const currentPrice = useMemo(() => {
    if (price) return price;
    if (product.prices.length === 0) return null;
    if (product.prices.length === 1) return product.prices[0];
    return product.prices.find((price) => price.interval === billingInterval);
  }, [billingInterval, price, product.prices]);

  const monthPrice = product.prices.find((price) => price.interval === 'month')?.unit_amount;
  const yearPrice = product.prices.find((price) => price.interval === 'year')?.unit_amount;
  const isBillingIntervalYearly = billingInterval === 'year';
  const metadata = productMetadataSchema.parse(product.metadata);
  const buttonVariantMap = {
    basic: 'default',
    pro: 'sexy',
    enterprise: 'orange',
  } as const;

  function handleBillingIntervalChange(billingInterval: BillingInterval) {
    setBillingInterval(billingInterval);
  }

  return (
    <div className='w-full flex-1 min-h-screen max-h-screen'>
    <div className='flex w-full flex-col rounded-md border border-[#C2BEB5] bg-white p-4 lg:p-8 transition-none hover:shadow-none hover:border-[#C2BEB5]'>
      <div className='p-4'>
        <div className='mb-1 text-center font-man text-xl font-bold text-[#3C3C3C]'>{product.name}</div>
        <div className='flex justify-center gap-0.5 text-[#3C3C3C] font-ibm'>
          <span className='font-semibold text-2xl'>
            {yearPrice && isBillingIntervalYearly
              ? '$' + yearPrice / 100
              : monthPrice
              ? '$' + monthPrice / 100
              : 'Custom'}
          </span>
          <span className='self-end'>{yearPrice && isBillingIntervalYearly ? '/year' : monthPrice ? '/month' : null}</span>
        </div>
      </div>

        {!Boolean(price) && product.prices.length > 1 && <PricingSwitch onChange={handleBillingIntervalChange} />}

        <div className='m-auto flex w-fit flex-1 flex-col gap-2 px-8 py-4'>
  {metadata.generatedImages === 'enterprise' && <CheckItem text={`Unlimited banner images`} />}
  {metadata.generatedImages !== 'enterprise' && (
    <CheckItem text={`Generate ${metadata.generatedImages} banner images`} />
  )}
  {<CheckItem text={`${metadata.imageEditor} image editing features`} />}
  {<CheckItem text={`${metadata.supportLevel} support`} />}
</div>

        {createCheckoutAction && (
          <div className='py-3'>
            {currentPrice && (
              <Button
                variant="default"  // Use a consistent variant
                className='w-full bg-[#00B7FC] text-black hover:bg-[#00B7FC] hover:no-underline font-man border-2 border-black'
                onClick={() => createCheckoutAction({ price: currentPrice })}
              >
                Get Started
              </Button>
            )}
            {!currentPrice && (
              <Button 
                variant="default"  // Use a consistent variant
                className='w-full bg-[#00B7FC] text-white hover:bg-[#00B7FC] hover:no-underline ' 
                asChild
              >
                <Link href='/contact'>Contact Us</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className='flex items-center gap-2 pt-2'>
      <IoCheckmark className='my-auto flex-shrink-0 text-[#3C3C3C]' />
      <p className='text-sm font-man text-[#3C3C3C] first-letter:capitalize'>{text}</p>
    </div>
  );
}


function PricingSwitch({ onChange }: { onChange: (interval: BillingInterval) => void }) {
  return (
    <Tabs 
      defaultValue="month" 
      className="w-full" 
      onValueChange={(value) => onChange(value as BillingInterval)}
    >
      <TabsList className="grid w-full grid-cols-2 bg-[#E8E4DB] my-2 border-[1px] border-black">
        <TabsTrigger 
          value="month"
          className="data-[state=active]:bg-[#3C3C3C] data-[state=active]:text-[#E8E4DB] data-[state=inactive]:bg-[#E8E4DB] data-[state=inactive]:text-[#3C3C3C] font-ibm"
        >
         MONTHLY
        </TabsTrigger>
        <TabsTrigger 
          value="year"
          className="data-[state=active]:bg-[#3C3C3C] data-[state=active]:text-[#E8E4DB] data-[state=inactive]:bg-[#E8E4DB] data-[state=inactive]:text-[#3C3C3C] font-ibm"
        >
         YEARLY
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}