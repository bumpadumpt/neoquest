import type { NextConfig } from "next";

const config: NextConfig = {
  // Keep development startup from writing generated agent files into the checkout.
  agentRules: false,
};

export default config;
