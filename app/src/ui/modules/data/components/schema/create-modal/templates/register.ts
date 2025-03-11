import type { IconType } from "react-icons";
import { TemplateMediaComponent, TemplateMediaMeta } from "./media";
import type { ReactNode } from "react";

export type StepTemplate = {
   id: string;
   title: string;
   description: string;
   Icon: IconType;
};

const Templates: [() => ReactNode, StepTemplate][] = [[TemplateMediaComponent, TemplateMediaMeta]];

export default Templates;
