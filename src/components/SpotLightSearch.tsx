'use client'

import { useState, useEffect } from 'react'
import { Command } from '@/components/ui/command'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

const mockSearchResults = [
  { id: 1, title: 'Arnold Circus Stool', description: 'Iconic stool design by Martino Gamper' },
  { id: 2, title: 'Arnoldino Stool', description: 'Compact version of the classic Arnold Circus' },
  { id: 3, title: 'Hookalotti', description: 'Versatile hook system for modern spaces' },
  { id: 4, title: 'Where to buy', description: 'Find authorized retailers in Australia & New Zealand' },
  { id: 5, title: 'Become a stockist', description: 'Partner with Stools & Co. for quality furniture' },
  { id: 6, title: 'Care Instructions', description: 'Maintain the beauty of your Stools & Co. products' },
  { id: 7, title: 'Custom Orders', description: 'Explore options for bespoke stool designs' },
  { id: 8, title: 'Our Story', description: 'Learn about the heritage of Stools & Co.' },
]

export default function Component() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const filteredResults = mockSearchResults.filter(
    (result) =>
      result.title.toLowerCase().includes(search.toLowerCase()) ||
      result.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Button
        variant="ghost"
        className="relative w-full justify-start text-base text-black sm:pr-12 md:w-64 lg:w-80 font-serif"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4 shrink-0" />
        <span className="text-gray-500">Search stools, hooks, and more...</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 bg-[#f5f0e8] border border-[#e0d9c7] shadow-lg max-w-2xl">
          <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-600 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <div className="flex items-center border-b border-[#e0d9c7] px-3" cmdk-input-wrapper="">
              <Search className="mr-2 h-4 w-4 shrink-0 text-gray-600" />
              <input
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-base outline-none placeholder:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 font-serif"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Stools & Co. products..."
              />
            </div>
            <ul className="max-h-[300px] overflow-y-auto overflow-x-hidden">
              {filteredResults.map((result) => (
                <li
                  key={result.id}
                  className="cursor-pointer px-2 py-1.5 text-sm hover:bg-[#faf6f0] font-serif"
                  onClick={() => {
                    console.log(`Selected: ${result.title}`)
                    setOpen(false)
                  }}
                >
                  <div className="font-medium text-black">{result.title}</div>
                  <div className="text-xs text-gray-600">{result.description}</div>
                </li>
              ))}
            </ul>
            {filteredResults.length === 0 && (
              <div className="py-6 text-center text-sm text-gray-600 font-serif">
                No results found. Try searching for our product names or categories.
              </div>
            )}
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}