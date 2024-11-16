import type { CodeComponentMeta } from "@plasmicapp/host";
import { Link } from "wouter";

export function WouterLink({ href, className, children, ...props }) {
   return (
      <Link href={href ?? "#"} className={className} {...props}>
         {children}
      </Link>
   );
}

export const WouterLinkMeta: CodeComponentMeta<any> = {
   name: "WouterLink",
   importPath: import.meta.dir,
   props: {
      href: {
         type: "href",
      },
      children: {
         type: "slot",
      },
   },
};
