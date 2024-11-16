// @deprecated: moved to @bknd/core
export async function sha256(password: string, salt?: string) {
   // 1. Convert password to Uint8Array
   const encoder = new TextEncoder();
   const data = encoder.encode((salt ?? "") + password);

   // 2. Hash the data using SHA-256
   const hashBuffer = await crypto.subtle.digest("SHA-256", data);

   // 3. Convert hash to hex string for easier display
   const hashArray = Array.from(new Uint8Array(hashBuffer));
   return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
