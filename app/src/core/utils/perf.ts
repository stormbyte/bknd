export class Perf {
   private marks: { mark: string; time: number }[] = [];
   private startTime: number;
   private endTime: number | null = null;

   private constructor() {
      this.startTime = performance.now();
   }

   static start(): Perf {
      return new Perf();
   }

   mark(markName: string): void {
      if (this.endTime !== null) {
         throw new Error("Cannot add marks after perf measurement has been closed.");
      }

      const currentTime = performance.now();
      const lastMarkTime =
         this.marks.length > 0 ? this.marks[this.marks.length - 1]!.time : this.startTime;
      const elapsedTimeSinceLastMark = currentTime - lastMarkTime;

      this.marks.push({ mark: markName, time: elapsedTimeSinceLastMark });
   }

   close(): void {
      if (this.endTime !== null) {
         throw new Error("Perf measurement has already been closed.");
      }
      this.endTime = performance.now();
   }

   result(): { total: number; marks: { mark: string; time: number }[] } {
      if (this.endTime === null) {
         throw new Error("Perf measurement has not been closed yet.");
      }

      const totalTime = this.endTime - this.startTime;
      return {
         total: Number.parseFloat(totalTime.toFixed(2)),
         marks: this.marks.map((mark) => ({
            mark: mark.mark,
            time: Number.parseFloat(mark.time.toFixed(2)),
         })),
      };
   }

   static async execute(fn: () => Promise<any>, times: number = 1): Promise<any> {
      const perf = Perf.start();

      for (let i = 0; i < times; i++) {
         await fn();
         perf.mark(`iteration-${i}`);
      }

      perf.close();
      return perf.result();
   }
}
