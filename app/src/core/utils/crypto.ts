export const HashAlgorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
export type HashAlgorithm = (typeof HashAlgorithms)[number];
export async function digest(alg: HashAlgorithm, input: string, salt?: string, pepper?: string) {
   if (!HashAlgorithms.includes(alg)) {
      throw new Error(`Invalid hash algorithm: ${alg}`);
   }

   // convert to Uint8Array
   const data = new TextEncoder().encode((salt ?? "") + input + (pepper ?? ""));

   // hash to alg
   const hashBuffer = await crypto.subtle.digest(alg, data);

   // convert hash to hex string
   const hashArray = Array.from(new Uint8Array(hashBuffer));
   return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const hash = {
   sha256: async (input: string, salt?: string, pepper?: string) =>
      digest("SHA-256", input, salt, pepper),
   sha1: async (input: string, salt?: string, pepper?: string) =>
      digest("SHA-1", input, salt, pepper)
};

export async function checksum(s: any) {
   const o = typeof s === "string" ? s : JSON.stringify(s);
   return await digest("SHA-1", o);
}
