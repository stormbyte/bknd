import { jest } from "bun:test";

let _oldFetch: typeof fetch;
export function mockFetch(responseMethods: Partial<Response>) {
   _oldFetch = global.fetch;
   // @ts-ignore
   global.fetch = jest.fn(() => Promise.resolve(responseMethods));
}

export function mockFetch2(newFetch: (input: RequestInfo, init: RequestInit) => Promise<Response>) {
   _oldFetch = global.fetch;
   // @ts-ignore
   global.fetch = jest.fn(newFetch);
}

export function unmockFetch() {
   global.fetch = _oldFetch;
}
