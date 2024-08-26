import React from 'react';
import Image from "next/image";
import Link from "next/link";
import { products } from '@/data/products';


export default function Plot() {
  return (
   
        <div className="flex flex-col w-full min-h-screen">
          <header className="flex flex-col sm:flex-row items-center justify-between w-full px-4 py-2 ">
            <nav className="flex items-center space-x-2 mb-0 sm:mb-0 ">
              <Link href="#" className="text-xs font-semibold" prefetch={false}>
                Stools & Co
              </Link>
              <Link href="#" className="text-sm" prefetch={false}>
                Products
              </Link>
            </nav>
            <nav className="flex items-center space-x-2">
              <Link href="#" className="text-sm" prefetch={false}>
                Where to buy
              </Link>
              <Link href="#" className="text-sm" prefetch={false}>
                Become a stockist
              </Link>
              <Link href="/dashboard/ai-chat" className="text-sm" prefetch={false}>
                AI Chat
              </Link>
            </nav>
          </header>
          <main className="flex-grow p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <Link href={`/product/${product.slug}`} key={product.id} prefetch={false}>
                  <div className="border p-4 rounded-lg hover:shadow-lg transition-shadow">
                    <Image src={product.image} alt={product.name} width={200} height={200} className="w-full h-48 object-cover mb-2" />
                    <h2 className="text-lg font-semibold">{product.name}</h2>
                    <p className="text-gray-600">${product.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </main>
        </div>

  );
}