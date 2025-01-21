import { type MetaFunction, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/server-runtime";

export const meta: MetaFunction = () => {
   return [{ title: "Remix & bknd" }, { name: "description", content: "Welcome to Remix & bknd!" }];
};

export const loader = async (args: LoaderFunctionArgs) => {
   const api = args.context.api;
   await api.verifyAuth();
   const { data } = await api.data.readMany("todos");
   return { data, user: api.getUser() };
};

export default function Index() {
   const { data, user } = useLoaderData<typeof loader>();

   return (
      <div>
         <h1>Data</h1>
         <pre>{JSON.stringify(data, null, 2)}</pre>
         <h1>User</h1>
         <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
   );
}
