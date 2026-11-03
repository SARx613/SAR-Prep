import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The private study material is read from disk at request time (see
  // src/lib/private-content.ts). It is git-ignored, so it exists only when you
  // deploy from your own machine; tracing it here makes Vercel ship it with the
  // functions that read it. A normal Git build has no such folder and ignores this.
  outputFileTracingIncludes: {
    "/official-tests": ["./private/**/*"],
    "/math-review": ["./private/**/*"],
    "/math-review/exercises/[part]": ["./private/**/*"],
    "/official-test/[id]": ["./private/**/*"],
    "/private-media/[...path]": ["./private/media/**/*"],
    "/api/private-access": ["./private/allowed-emails.json"],
  },
};

export default nextConfig;
