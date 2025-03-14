import { PostHog } from "posthog-js-lite";
import { getVersion } from "cli/utils/sys";
import { $console, env } from "core";

type Properties = { [p: string]: any };

let posthog: PostHog | null = null;
let version: string | null = null;

const enabled = env("cli_telemetry");

export async function init() {
   try {
      if (!enabled) {
         $console.debug("Telemetry disabled");
         return;
      }

      $console.debug("Init telemetry");
      if (!posthog) {
         posthog = new PostHog(process.env.POSTHOG_KEY!, {
            host: process.env.POSTHOG_HOST!,
            disabled: !enabled,
         });
      }
      version = await getVersion();
   } catch (e) {
      $console.debug("Failed to initialize telemetry", e);
   }
}

export function client(): PostHog {
   if (!posthog) {
      throw new Error("PostHog client not initialized. Call init() first.");
   }

   return posthog;
}

export function capture(event: string, properties: Properties = {}): void {
   try {
      if (!enabled) return;

      const name = `cli_${event}`;
      const props = {
         ...properties,
         version: version!,
      };
      $console.debug("Capture", name, props);
      client().capture(name, props);
   } catch (e) {
      $console.debug("Failed to capture telemetry", e);
   }
}

export function createScoped(scope: string, p: Properties = {}) {
   const properties = p;
   const _capture = (event: string, props: Properties = {}) => {
      return capture(`${scope}_${event}`, { ...properties, ...props });
   };
   return { capture: _capture, properties };
}

export async function flush() {
   try {
      if (!enabled) return;

      $console.debug("Flush telemetry");
      if (posthog) {
         await posthog.flush();
      }
   } catch (e) {
      $console.debug("Failed to flush telemetry", e);
   }
}
