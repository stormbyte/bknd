import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { Api } from "bknd";
import { useClient } from "bknd/ui";

export const meta: MetaFunction = () => {
   return [{ title: "Remix & bknd" }, { name: "description", content: "Welcome to Remix & bknd!" }];
};

export const loader = async (args: LoaderFunctionArgs) => {
   const api = args.context.api as Api;
   const { data } = await api.data.readMany("todos");
   return { data };
};

export default function Index() {
   const data = useLoaderData<typeof loader>();
   const client = useClient();

   const query = client.query().data.entity("todos").readMany();

   return (
      <div>
         hello
         <pre>{client.baseUrl}</pre>
         <pre>{JSON.stringify(data, null, 2)}</pre>
         <pre>{JSON.stringify(query.data, null, 2)}</pre>
      </div>
   );
}
