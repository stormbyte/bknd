import { getApi } from "@/bknd";
import { revalidatePath } from "next/cache";
import { Fragment } from "react";
import { List } from "@/components/List";

export default async function Home() {
   // without "{ verify: true }", this page can be static
   const api = await getApi();
   const limit = 5;
   const todos = await api.data.readMany("todos", { limit, sort: "-id" });
   const total = todos.body.meta.total;

   return (
      <>
         <Description />
         <div className="flex flex-col border border-foreground/15 w-full py-4 px-5 gap-2">
            <h2 className="font-mono mb-1 opacity-70">
               <code>What's next?</code>
            </h2>
            <div className="flex flex-col w-full gap-2">
               {total > limit && (
                  <div className="bg-foreground/10 flex justify-center p-1 text-xs rounded text-foreground/40">
                     {total - limit} more todo(s) hidden
                  </div>
               )}
               <div className="flex flex-col gap-3">
                  {todos.reverse().map((todo) => (
                     <div className="flex flex-row" key={String(todo.id)}>
                        <div className="flex flex-row flex-grow items-center gap-3 ml-1">
                           <input
                              type="checkbox"
                              className="flex-shrink-0 cursor-pointer"
                              defaultChecked={!!todo.done}
                              onChange={async () => {
                                 "use server";
                                 const api = await getApi();
                                 await api.data.updateOne("todos", todo.id, {
                                    done: !todo.done,
                                 });
                                 revalidatePath("/");
                              }}
                           />
                           <div className="text-foreground/90 leading-none">{todo.title}</div>
                        </div>
                        <button
                           type="button"
                           className="cursor-pointer grayscale transition-all hover:grayscale-0 text-xs "
                           onClick={async () => {
                              "use server";
                              const api = await getApi();
                              await api.data.deleteOne("todos", todo.id);
                              revalidatePath("/");
                           }}
                        >
                           ❌
                        </button>
                     </div>
                  ))}
               </div>
               <form
                  className="flex flex-row w-full gap-3 mt-2"
                  key={todos.map((t) => t.id).join()}
                  action={async (formData: FormData) => {
                     "use server";
                     const title = formData.get("title") as string;
                     const api = await getApi();
                     await api.data.createOne("todos", { title });
                     revalidatePath("/");
                  }}
               >
                  <input
                     type="text"
                     name="title"
                     placeholder="New todo"
                     className="py-2 px-4 flex flex-grow rounded-sm bg-foreground/10 focus:bg-foreground/20 transition-colors outline-none"
                  />
                  <button type="submit" className="cursor-pointer">
                     Add
                  </button>
               </form>
            </div>
         </div>
      </>
   );
}

const Description = () => (
   <List
      items={["Get started with a full backend.", "Focus on what matters instead of repetition."]}
   />
);
