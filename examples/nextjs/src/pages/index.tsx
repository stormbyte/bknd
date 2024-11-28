import { withApi } from "bknd/adapter/nextjs";
import type { InferGetServerSidePropsType } from "next";

export const getServerSideProps = withApi(async (context) => {
   const { data = [] } = await context.api.data.readMany("todos");
   const user = context.api.getUser();

   return { props: { data, user } };
});

export default function Home({
   data,
   user
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
   return (
      <div>
         <h1>Data</h1>
         <pre>{JSON.stringify(data, null, 2)}</pre>

         <h1>User</h1>
         <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
   );
}
