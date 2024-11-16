import { ucFirstAllSnakeToPascalWithSpaces } from "core/utils";
import { useMemo } from "react";
import { TbArrowLeft, TbDots } from "react-icons/tb";
import { Link, useLocation } from "wouter";
import { IconButton } from "../../components/buttons/IconButton";
import { Dropdown } from "../../components/overlay/Dropdown";
import { useEvent } from "../../hooks/use-event";

export type BreadcrumbsProps = {
   path: string | string[];
   backTo?: string;
   onBack?: () => void;
};

export const Breadcrumbs = ({ path: _path, backTo, onBack }: BreadcrumbsProps) => {
   const [_, navigate] = useLocation();
   const location = window.location.pathname;
   const path = Array.isArray(_path) ? _path : [_path];
   const loc = location.split("/").filter((v) => v !== "");
   const hasBack = path.length > 1;

   const goBack = onBack
      ? onBack
      : useEvent(() => {
           if (backTo) {
              navigate(backTo, { replace: true });
              return;
           }

           const href = loc.slice(0, path.length + 1).join("/");
           navigate(`~/${href}`, { replace: true });
        });

   const crumbs = useMemo(
      () =>
         path.map((p, key) => {
            const last = key === path.length - 1;
            const index = loc.indexOf(p);
            const href = loc.slice(0, index + 1).join("/");
            const string = ucFirstAllSnakeToPascalWithSpaces(p);

            return {
               last,
               href,
               string
            };
         }),
      [path, loc]
   );

   return (
      <div className="flex flex-row flex-grow items-center gap-2 text-lg">
         {hasBack && (
            <IconButton
               onClick={goBack}
               Icon={TbArrowLeft}
               variant="default"
               size="lg"
               className="mr-1"
            />
         )}
         <div className="hidden md:flex gap-2">
            <CrumbsDesktop crumbs={crumbs} />
         </div>
         <div className="flex md:hidden gap-2">{<CrumbsMobile crumbs={crumbs} />}</div>
      </div>
   );
};

const CrumbsDesktop = ({ crumbs }) => {
   return crumbs.map((crumb, key) => {
      return crumb.last ? <CrumbLast key={key} {...crumb} /> : <CrumbLink key={key} {...crumb} />;
   });
};

const CrumbsMobile = ({ crumbs }) => {
   const [, navigate] = useLocation();
   if (crumbs.length <= 2) return <CrumbsDesktop crumbs={crumbs} />;
   const first = crumbs[0];
   const last = crumbs[crumbs.length - 1];
   const items = useMemo(
      () =>
         crumbs.slice(1, -1).map((c) => ({
            label: c.string,
            href: c.href
         })),
      [crumbs]
   );
   const onClick = useEvent((item) => navigate(`~/${item.href}`));

   return (
      <>
         <CrumbLink {...first} />
         <Dropdown onClickItem={onClick} items={items}>
            <IconButton Icon={TbDots} variant="ghost" />
         </Dropdown>
         <span className="opacity-25 dark:font-bold font-semibold">/</span>
         <CrumbLast {...last} />
      </>
   );
};

const CrumbLast = ({ string }) => {
   return <span className="text-nowrap dark:font-bold font-semibold">{string}</span>;
};

const CrumbLink = ({ href, string }) => {
   return (
      <div className="opacity-50 flex flex-row gap-2 dark:font-bold font-semibold">
         <Link to={`~/${href}`} className="text-nowrap">
            {string}
         </Link>
         <span className="opacity-50">/</span>
      </div>
   );
};
