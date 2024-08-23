'use client'

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { StarIcon, PlusIcon, MailIcon, CheckIcon } from 'lucide-react'

export default function ProductPage({ product }) {
  const [selectedOption, setSelectedOption] = useState('pot')

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <nav className="text-sm mb-6">
        <ol className="list-none p-0 inline-flex">
          <li className="flex items-center">
            <Link href="/" className="text-gray-500">Home</Link>
            <span className="mx-2">&gt;</span>
          </li>
          <li className="flex items-center">
            <Link href="/products" className="text-gray-500">Products</Link>
            <span className="mx-2">&gt;</span>
          </li>
          <li className="flex items-center">
            <span className="text-gray-900">{product.name}</span>
          </li>
        </ol>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            layout="responsive"
            width={500}
            height={500}
            objectFit="cover"
          />
          <button className="absolute bottom-4 right-4 bg-white rounded-full p-2 shadow-md">
            <PlusIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center">
              <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm">4.6</span>
              <a href="#" className="ml-1 text-sm text-blue-600">(499 reviews)</a>
            </div>
          </div>
          
          <p className="text-gray-600">{product.description || 'Product description not available.'}</p>

          <div className="space-y-3">
            <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer">
              <input
                type="radio"
                name="option"
                value="pot"
                checked={selectedOption === 'pot'}
                onChange={() => setSelectedOption('pot')}
                className="form-radio text-blue-600"
              />
              <span className="flex-grow">
                <span className="font-semibold">pot</span> - <span className="line-through">€27</span> <span className="text-orange-500 font-semibold">-30% €18,90</span>
                <br />
                <span className="text-sm text-gray-500">18 porties (€1,05/portie)</span>
              </span>
            </label>
            <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer">
              <input
                type="radio"
                name="option"
                value="probeerverpakking"
                checked={selectedOption === 'probeerverpakking'}
                onChange={() => setSelectedOption('probeerverpakking')}
                className="form-radio text-blue-600"
              />
              <span className="flex-grow">
                <span className="font-semibold">probeerverpakking</span> - <span className="line-through">€3</span> <span className="inline-block bg-red-100 text-red-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">-67%</span> <span className="text-orange-500 font-semibold">€1</span>
                <br />
                <span className="text-sm text-gray-500">1 portie (€1,-/portie)</span>
              </span>
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-orange-100 rounded-lg">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-orange-400 rounded-full mr-3"></div>
                <span>Strawberry</span>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center">
                Add <PlusIcon className="ml-2 w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-green-400 rounded-full mr-3"></div>
                <span>Lemon (sold out)</span>
              </div>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md flex items-center">
                Notify me <MailIcon className="ml-2 w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-100 rounded-lg">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-yellow-400 rounded-full mr-3"></div>
                <span>Orange (sold out)</span>
              </div>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md flex items-center">
                Notify me <MailIcon className="ml-2 w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center text-green-600">
            <CheckIcon className="w-5 h-5 mr-2" />
            <span>Order today = Delivered tomorrow.</span>
          </div>
        </div>
      </div>
    </div>
  );
}