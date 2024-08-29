/** @type {import('next').NextConfig} */


module.exports = nextConfig
const nextConfig = {
  reactStrictMode: true,
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: 'http://127.0.0.1:8000/api/:path*', // Make sure this is http
  //     },
  //   ]
  // },
}

export default nextConfig;