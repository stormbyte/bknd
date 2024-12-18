import { useApi } from "bknd/client";

export default function Test() {
   const api = useApi(undefined);
   return <div>{api.baseUrl}</div>;
}
