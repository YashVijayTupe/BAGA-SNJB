/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/flask/:path*",
        destination: "http://localhost:5001/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
