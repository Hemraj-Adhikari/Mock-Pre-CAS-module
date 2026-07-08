/** @type {import('next').NextConfig} */
// GitHub Pages serves plain static files, so this app is built as a fully
// static export (`output: 'export'`). Everything here already runs
// client-side (camera, speech recognition, sessionStorage, PDF export), so
// nothing depends on a Node server -- static export works out of the box.
//
// GitHub *project* pages are served at
//   https://<user>.github.io/<repo-name>/
// so every internal link needs a basePath of `/<repo-name>`. The deploy
// workflow (.github/workflows/deploy.yml) sets NEXT_PUBLIC_BASE_PATH
// automatically from the repo name at build time -- you don't need to edit
// this file by hand.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
