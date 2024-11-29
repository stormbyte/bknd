import { adminPage } from "bknd/adapter/remix";
import "bknd/dist/styles.css";

export default adminPage({
   config: {
      basepath: "/admin"
   }
});
