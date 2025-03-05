import { registries } from "bknd";
import {
   type LocalAdapterConfig,
   StorageLocalAdapter,
} from "../../media/storage/adapters/StorageLocalAdapter";

export * from "./node.adapter";
export { StorageLocalAdapter, type LocalAdapterConfig };

export function registerLocalMediaAdapter() {
   registries.media.register("local", StorageLocalAdapter);
}
