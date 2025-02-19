import { type MetaFunction, useFetcher, useLoaderData, useOutletContext } from "@remix-run/react";
import type { ActionFunctionArgs } from "@remix-run/server-runtime";
import { getApi } from "~/bknd";

export const meta: MetaFunction = () => {
   return [
      { title: "New bknd-Remix App" },
      { name: "description", content: "Welcome to bknd & Remix!" }
   ];
};

export const loader = async () => {
   const api = await getApi();

   const limit = 5;
   const {
      data: todos,
      body: { meta }
   } = await api.data.readMany("todos", {
      limit,
      sort: "-id"
   });

   return { todos: todos.reverse(), total: meta.total, limit };
};

export const action = async (args: ActionFunctionArgs) => {
   const api = await getApi();
   const formData = await args.request.formData();
   const action = formData.get("action") as string;

   switch (action) {
      case "update": {
         const id = Number(formData.get("id"));
         const done = formData.get("done") === "on";

         if (id > 0) {
            await api.data.updateOne("todos", id, { done });
         }
         break;
      }
      case "add": {
         const title = formData.get("title") as string;

         if (title.length > 0) {
            await api.data.createOne("todos", { title });
         }
         break;
      }
      case "delete": {
         const id = Number(formData.get("id"));

         if (id > 0) {
            await api.data.deleteOne("todos", id);
         }
         break;
      }
   }

   return null;
};

export default function Index() {
   const ctx = useOutletContext<any>();
   const { todos, total, limit } = useLoaderData<typeof loader>();
   const fetcher = useFetcher();

   return (
      <div className="flex h-screen items-center justify-center">
         <div className="flex flex-col items-center gap-16">
            <header className="flex flex-col items-center gap-9">
               <h1 className="leading text-2xl font-bold text-gray-800 dark:text-gray-100">
                  bknd w/ <span className="sr-only">Remix</span>
               </h1>
               <div className="h-[144px] w-[434px]">
                  <img src="/logo-light.png" alt="Remix" className="block w-full dark:hidden" />
                  <img src="/logo-dark.png" alt="Remix" className="hidden w-full dark:block" />
               </div>
            </header>
            <nav className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-gray-200 p-6 dark:border-gray-700">
               <p className="leading-6 text-gray-700 dark:text-gray-200 font-bold">
                  What&apos;s next? ({total})
               </p>
               <div className="flex flex-col w-full gap-2">
                  {total > limit && (
                     <div className="bg-white/10 flex justify-center p-1 text-xs rounded text-gray-500">
                        {total - limit} more todo(s) hidden
                     </div>
                  )}
                  {todos.map((todo) => (
                     <div className="flex flex-row" key={String(todo.id)}>
                        <fetcher.Form
                           className="flex flex-row flex-grow items-center gap-3 ml-1"
                           method="post"
                        >
                           <input
                              type="checkbox"
                              name="done"
                              defaultChecked={todo.done}
                              onChange={(e) => fetcher.submit(e.currentTarget.form!)}
                           />
                           <input type="hidden" name="action" value="update" />
                           <input type="hidden" name="id" value={String(todo.id)} />
                           <div className="dark:text-gray-300 text-gray-800">{todo.title}</div>
                        </fetcher.Form>
                        <fetcher.Form className="flex items-center" method="post">
                           <input type="hidden" name="action" value="delete" />
                           <input type="hidden" name="id" value={String(todo.id)} />
                           <button
                              type="submit"
                              className="cursor-pointer grayscale transition-all hover:grayscale-0 text-xs "
                           >
                              ❌
                           </button>
                        </fetcher.Form>
                     </div>
                  ))}
                  <fetcher.Form
                     className="flex flex-row gap-3 mt-2"
                     method="post"
                     key={todos.map((t) => t.id).join()}
                  >
                     <input
                        type="text"
                        name="title"
                        placeholder="New todo"
                        className="py-2 px-4 rounded-xl bg-black/5 dark:bg-white/10"
                     />
                     <input type="hidden" name="action" value="add" />
                     <button type="submit" className="cursor-pointer">
                        Add
                     </button>
                  </fetcher.Form>
               </div>
            </nav>
            <div className="flex flex-col items-center gap-4">
               <a href="/admin">Go to Admin ➝</a>
               <div className="opacity-50 text-xs">
                  {ctx.user ? (
                     <p>
                        Authenticated as <b>{ctx.user.email}</b>
                     </p>
                  ) : (
                     <a href="/admin/auth/login">Login</a>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}
