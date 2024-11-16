import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   /* config options here */
   reactStrictMode: true

   /*transpilePackages: [
      "@rjsf/core",
      "@libsql/isomorphic-fetch",
      "@libsql/isomorphic-ws",
      "@libsql/kysely-libsql"
   ],
   experimental: {
      esmExternals: "loose"
   }*/
};

export default nextConfig;
