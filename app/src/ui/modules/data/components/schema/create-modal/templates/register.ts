import type { IconType } from "react-icons";
import { TemplateMediaComponent, TemplateMediaMeta } from "./media";

export type StepTemplate = {
   id: string;
   title: string;
   description: string;
   Icon: IconType;
};

const Templates: [() => JSX.Element, StepTemplate][] = [
   [TemplateMediaComponent, TemplateMediaMeta]
];

export default Templates;
