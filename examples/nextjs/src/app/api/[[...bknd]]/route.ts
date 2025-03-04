import { config } from "@/bknd";
import { serve } from "bknd/adapter/nextjs";

// since we're using the local media adapter in this example,
// we can't use the edge runtime.
// export const runtime = "edge";

const handler = serve({
   ...config,
   cleanRequest: {
      searchParams: ["bknd"],
   },
});

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
