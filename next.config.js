/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
  },
  future: {
    webpack5: false, // by default, if you customize webpack config, they switch back to version 4. 
    // Looks like backward compatibility approach.
  },
  webpack: (config, { isServer }) => {

    // If client-side, don't polyfill `fs`
    if (!isServer) {
      config.resolve.fallback = {
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
