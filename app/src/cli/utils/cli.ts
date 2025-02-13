export async function wait(ms: number) {
   return new Promise((r) => setTimeout(r, ms));
}

export async function* typewriter(
   text: string,
   delay: number,
   transform?: (char: string) => string
) {
   for (const char of text) {
      yield transform ? transform(char) : char;
      await wait(delay);
   }
}
