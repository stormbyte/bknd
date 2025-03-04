import { getApi } from "@/bknd";
import { Buttons, List } from "../layout";

export default async function SSRPage() {
   const api = await getApi({ verify: true });
   const { data } = await api.data.readMany("todos");
   const user = api.getUser();

   return (
      <>
         <List items={data.map((todo) => todo.title)} />
         <Buttons />

         <p>
            {user ? (
               <>
                  Logged in as {user.email}.{" "}
                  <a className="font-medium underline" href="/api/auth/logout">
                     Logout
                  </a>
               </>
            ) : (
               <>
                  Not logged in.{" "}
                  <a className="font-medium underline" href="/admin/auth/login">
                     Login
                  </a>
               </>
            )}
         </p>
      </>
   );
}
