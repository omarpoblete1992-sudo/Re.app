import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  eslint: {
    dirs: ['app', 'components', 'lib', 'hooks', 'types'],
  },
};

export default nextConfig;
