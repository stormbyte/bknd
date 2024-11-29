import { adminPage, getServerSideProps } from "bknd/adapter/nextjs";
import "bknd/dist/styles.css";

export { getServerSideProps };
export default adminPage({
   config: {
      basepath: "/admin"
   }
});
