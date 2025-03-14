import { getApi } from "@/bknd";
import { Buttons } from "@/components/Buttons";
import { List } from "@/components/List";
import Link from "next/link";

export default async function SSRPage() {
   const api = await getApi({ verify: true });
   const { data } = await api.data.readMany("todos");
   const user = api.getUser();

   return (
      <>
         <List items={data.map((todo) => todo.title)} />
         <Buttons />

         <div>
            {user ? (
               <>
                  Logged in as {user.email}.{" "}
                  <Link className="font-medium underline" href="/api/auth/logout">
                     Logout
                  </Link>
               </>
            ) : (
               <div className="flex flex-col gap-1">
                  <p>
                     Not logged in.{" "}
                     <Link className="font-medium underline" href="/admin/auth/login">
                        Login
                     </Link>
                  </p>
                  <p className="text-xs opacity-50">
                     Sign in with:{" "}
                     <b>
                        <code>test@bknd.io</code>
                     </b>{" "}
                     /{" "}
                     <b>
                        <code>12345678</code>
                     </b>
                  </p>
               </div>
            )}
         </div>
      </>
   );
}
