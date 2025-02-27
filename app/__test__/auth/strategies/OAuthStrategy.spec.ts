import { describe, test } from "bun:test";
import { OAuthStrategy } from "../../../src/auth/authenticate/strategies";

const ALL_TESTS = !!process.env.ALL_TESTS;

describe("OAuthStrategy", async () => {
   const strategy = new OAuthStrategy({
      type: "oidc",
      client: {
         client_id: process.env.OAUTH_CLIENT_ID,
         client_secret: process.env.OAUTH_CLIENT_SECRET,
      },
      name: "google",
   });
   const state = "---";
   const redirect_uri = "http://localhost:3000/auth/google/callback";

   test.skipIf(ALL_TESTS)("...", async () => {
      const config = await strategy.getConfig();
      console.log("config", JSON.stringify(config, null, 2));

      const request = await strategy.request({
         redirect_uri,
         state,
      });

      const server = Bun.serve({
         fetch: async (req) => {
            const url = new URL(req.url);
            if (url.pathname === "/auth/google/callback") {
               console.log("req", req);
               const user = await strategy.callback(url, {
                  redirect_uri,
                  state,
               });

               console.log("---user", user);
            }
            return new Response("Bun!");
         },
      });
      console.log("request", request);

      await new Promise((resolve) => setTimeout(resolve, 100000));
   });
});
