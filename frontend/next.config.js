/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    'socket.io-parser',
    'socket.io-client',
    '@metamask/sdk',
    '@wagmi/connectors',
    'wagmi',
    'debug',
    'supports-color'
  ],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      os: false,
      tls: false,
      fs: false,
      path: false,
    };
    return config;
  },
}

module.exports = nextConfig
