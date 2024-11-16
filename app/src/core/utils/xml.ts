import { XMLParser } from "fast-xml-parser";

export function xmlToObject(xml: string) {
   const parser = new XMLParser();
   return parser.parse(xml);
}
