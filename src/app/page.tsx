import Image from 'next/image'
import Link from 'next/link'
import { Star, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react'

export default function Component() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      <div className="w-full max-w-6xl px-6 lg:px-8 ">
        <header className="flex justify-between items-center py-6 px-10">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-black rounded-full"></div>
            <span className="text-sm font-medium">/sales@oppopay.io</span>
          </div>
          {/* <nav className="hidden lg:flex space-x-8">
            <Link href="#" className="text-sm">Product</Link>
            <Link href="#" className="text-sm">Solutions</Link>
            <Link href="#" className="text-sm">Pricing</Link>
            <Link href="#" className="text-sm">Developers</Link>
          </nav> */}
          <div className="flex items-center space-x-4">
            <Link href="#" className="text-sm hidden lg:inline-block">Log in</Link>
            <Link href="#" className="bg-black text-white px-4 py-2 rounded-full text-sm">
              Apply Now — It's Free
            </Link>
          </div>
        </header>

        <main className="flex-1">
          <div className="container mx-auto py-16">
            <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-16">
              <div className="lg:w-1/2">
                <div className="flex items-center space-x-2">
                  <div className="p-1 border border-gray-300 rounded-full">
                    <Star className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium ">5.0 Rated</span>
                  <span className="text-sm text-gray-500">Over 12.5K — Ratings on Hunt</span>
                </div>

                <h1 className="text-7xl lg:text-9xl font-serif leading-none pt-3 pb-8 font-Marcellus">Payment</h1>

               
                <blockquote className="text-md font-medium border-t-[1px] pt-4">
                <div className="flex items-center justify-between pb-5">
  <div className="flex items-center space-x-2">
    <Image src="/placeholder.svg" width={24} height={24} alt="Lattice logo" />
    <span className="font-medium">Lattice</span>
  </div>
  <Link href="#" className="text-xs text-gray-500 flex items-center">
    Read Story <ArrowUpRight className="w-4 h-4 ml-1" />
  </Link>
</div>

                  "The Best Platform To Use For International Payout and Bank Transfers, Highly Recommend"
                </blockquote>

                <div className="flex items-center space-x-4 border-b-[1px] pb-4 pt-4 font-Marcellus text-xs">
                  <Image src="/placeholder.svg" width={48} height={48} alt="Robert J." className="rounded-full" />
                  <div >
                    <p className="text-sm font-bold">Robert J.</p>
                    <p className="text-gray-500">UX / Motion Designer</p>
                  </div>
                </div>

                <div className="flex space-x-4 pt-12">
                  <Link href="#" className="bg-black text-white px-6 py-3 rounded-full text-sm font-medium">
                    Apply Now — It's Free
                  </Link>
                  <Link href="#" className="border border-gray-300 px-6 py-3 rounded-full text-sm font-medium">
                    Our Process
                  </Link>
                </div>
              </div>

              <div className="lg:w-1/2 mt-12 lg:mt-0">
                <div className="bg-gradient-to-br from-blue-100 via-purple-50 to-orange-100 p-8  aspect-square max-w-lg mx-auto">
                  <div className="bg-white p-4 mb-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center">
                      <Image src="/placeholder.svg" width={40} height={24} alt="Visa" className="mr-2" />
                      <span className="text-sm">Jenifer Paid $14,800 USD for Design</span>
                    </div>
                    <CheckCircle2 className="text-green-500 w-5 h-5" />
                  </div>

                  <div className="bg-white p-6 rounded-2xl mb-4 shadow-sm">
                    <div className="flex justify-between mb-4">
                      <div className="w-12 h-8 bg-gray-200 rounded"></div>
                      <Image src="/placeholder.svg" width={40} height={24} alt="Mastercard logo" />
                    </div>
                    <p className="text-2xl font-mono mb-6">8923 2461 5320 7642</p>
                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">Name</p>
                        <p>Dean Ambrose</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Exp Date</p>
                        <p>07/28</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">CVV</p>
                        <p>923</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center">
                      <Image src="/placeholder.svg" width={32} height={32} alt="User" className="rounded-full mr-2" />
                      <span className="text-sm">Your Payment $1450 is Declined</span>
                    </div>
                    <AlertCircle className="text-red-500 w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="w-full py-16">
          <div className="container mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-8">
              {['Rakuten', 'NCR', 'Monday.com', 'Disney', 'Dropbox'].map((logo, index) => (
                <Image key={index} src="/placeholder.svg" width={120} height={40} alt={`${logo} logo`} className="grayscale" />
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}