import Image from "next/image";
import Link from "next/link";
import { redirect } from 'next/navigation';

import { products } from '@/data/products';

import { CollaborativeApp } from "./CollaborativeApp";

export default function Page() {

  interface Product {
    id: number
    name: string
    price: number
    image: string
    slug: string
    weight: string
    servings: string
  }

// Mock product data (replace with actual data from your backend)
const products: Product[] = [
  { id: 1, name: "Arnold Circus Stool", price: 20, weight: "500g", servings: "22 servings", image: "/test.png", slug: "arnold-circus-stool" },
  { id: 2, name: "Arnoldino Stool", price: 30, weight: "500g",servings: "22 servings",image: "/test.png", slug: "arnoldino-stool" },
  { id: 3, name: "Hookalotti", price: 40, weight: "500g",servings: "22 servings",image: "/test.png", slug: "hookalotti" },
  { id: 4, name: "Chicken", price: 40, weight: "500g",servings: "22 servings",image: "/test.png", slug: "chicken" },
  { id: 5, name: "Hookalotti", price: 40, weight: "500g", servings: "22 servings",image: "/test.png", slug: "hookalotti" },
];

  return (
     <><div className="flex flex-col w-full min-h-screen">
      <header className="flex flex-col sm:flex-row items-center justify-between w-full px-4 py-2 ">
        <nav className="flex items-center space-x-2 mb-0 sm:mb-0 ">
          <Link href="#" className="text-xs font-semibold" prefetch={false}>
            Stools & Co
          </Link>
          {/* <Link href="#" className="text-sm" prefetch={false}>
            Products
          </Link> */}
        </nav>
        {/* <nav className="flex items-center space-x-2">
          <Link href="#" className="text-sm" prefetch={false}>
            Where to buy
          </Link>
          <Link href="#" className="text-sm" prefetch={false}>
            Become a stockist
          </Link>
          <Link href="/dashboard/ai-chat" className="text-sm" prefetch={false}>
            AI Chat
          </Link>
        </nav> */}
      </header>
      <main className="flex flex-col w-full p-4 space-y-4">
        <div className="max-w-4xl w-full">
          <p className="text-sm sm:text-base mb-2 mt-10 text-left">
            Stools & Co. are the Australia & New Zealand licensed manufacturer and distributor of the
            <span className="font-bold"> Arnold Circus Stool</span>, <span className="font-bold">Arnoldino Stool</span>,{" "}
            <span className="font-bold">Hookalotti</span> designed by Martino Gamper.
          </p>
        </div>
        <div className="w-full overflow-x-auto max-h-screen">
          <div className="flex space-x-4 sm:space-x-6 h-[calc(100vh-230px)] sm:h-[calc(100vh-220px)] lg:h-[calc(100vh-180px)]">
            {products.map((product) => (
              <Link key={product.id} href={`/product/${product.slug}`} className="flex-shrink-0 w-64 sm:w-80 lg:w-96 xl:w-[28rem] h-full">
                <div className="relative w-full h-full">
                  <Image
                    src={product.image}
                    alt={product.name}
                    layout="fill"
                    objectFit="cover" />
                  <div className="absolute bottom-0 left-0 p-4 text-black bg-white bg-opacity-75 w-full">
                    <h3 className="text-xl font-semibold pb-1">{product.name}</h3>
                    <div className='flex space-x-2'>
                      <p className="text-md">${product.price}</p>
                      <span>|</span>
                      <p className="text-md">{product.servings}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div><CollaborativeApp /></>
   
  );
};