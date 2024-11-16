import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear.js";

declare module "dayjs" {
   interface Dayjs {
      week(): number;

      week(value: number): dayjs.Dayjs;
   }
}

dayjs.extend(weekOfYear);

export { dayjs };
