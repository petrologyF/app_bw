import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const isGithubActions = process.env.GITHUB_ACTIONS || false;
let repo = '';

if (isGithubActions) {
  const repoString = process.env.GITHUB_REPOSITORY || '';    // e.g. "user/repo"
  repo = `/${repoString.split('/')[1]}`;
}

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  output: "export",
  basePath: repo !== '/' ? repo : '',
  images: {
    unoptimized: true,
  },
  turbopack: {},
};

export default withPWA(nextConfig);
