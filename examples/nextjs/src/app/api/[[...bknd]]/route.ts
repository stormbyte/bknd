import { getApp } from "@/bknd";

const handler = async (request: Request) => {
   const app = await getApp();
   return app.fetch(request);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
