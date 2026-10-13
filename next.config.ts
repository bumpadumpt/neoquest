import type { NextConfig } from "next";

const githubPages = process.env.NEOQUEST_GITHUB_PAGES === "true";

const config: NextConfig = {
  // Keep development startup from writing generated agent files into the checkout.
  agentRules: false,
  // Optional static build for the repository's GitHub Pages site.
  ...(githubPages && {
    output: "export",
    basePath: "/neoquest",
    trailingSlash: true,
  }),
};

export default config;
