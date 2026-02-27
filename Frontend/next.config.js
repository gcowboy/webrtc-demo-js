/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@telnyx/webrtc', '@telnyx/rtc-sipjs-simple-user'],
  experimental: {
    urlImports: ['https://esm.sh'],
  },
};

module.exports = nextConfig;
