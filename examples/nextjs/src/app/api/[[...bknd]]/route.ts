import { getApp } from "@/bknd";

// if you're not using a local media adapter, or file database,
// you can uncomment this line to enable running bknd on edge
// export const runtime = "edge";

const handler = async (request: Request) => {
   const app = await getApp();
   return app.fetch(request);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
