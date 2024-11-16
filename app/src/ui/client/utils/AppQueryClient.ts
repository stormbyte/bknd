import {
   type QueryObserverOptions,
   type UseQueryResult,
   keepPreviousData,
   useMutation,
   useQuery
} from "@tanstack/react-query";
import type { AuthResponse } from "auth";
import type { EntityData, RepoQuery, RepositoryResponse } from "data";
import { Api } from "../../../Api";
import type { ApiResponse } from "../../../modules/ModuleApi";
import { queryClient } from "../ClientProvider";

export class AppQueryClient {
   api: Api;
   constructor(public baseUrl: string) {
      this.api = new Api({
         host: baseUrl,
         tokenStorage: "localStorage"
      });
   }

   queryOptions(options?: Partial<QueryObserverOptions>): Partial<QueryObserverOptions> {
      return {
         staleTime: 1000 * 60 * 5,
         placeholderData: keepPreviousData,
         ...options
      };
   }

   auth = () => {
      return {
         state: (): (AuthResponse & { verified: boolean }) | undefined => {
            return this.api.getAuthState() as any;
         },
         login: async (data: { email: string; password: string }): Promise<
            ApiResponse<AuthResponse>
         > => {
            return await this.api.auth.loginWithPassword(data);
         },
         register: async (data: any): Promise<ApiResponse<AuthResponse>> => {
            return await this.api.auth.registerWithPassword(data);
         },
         logout: async () => {
            this.api.updateToken(undefined);
            return true;
         },
         setToken: (token) => {
            this.api.updateToken(token);
            return this.api.getAuthState();
         },
         verify: async () => {
            console.log("verifiying");
            const res = await this.api.auth.me();
            console.log("verifying result", res);
            if (!res.res.ok) {
               this.api.markAuthVerified(false);
               this.api.updateToken(undefined);
            } else {
               this.api.markAuthVerified(true);
            }
         }
      };
   };

   media = (options?: Partial<QueryObserverOptions>) => {
      const queryOptions = this.queryOptions(options);
      return {
         api: () => {
            return this.api.media;
         },
         list: (query: Partial<RepoQuery> = { limit: 10 }): UseQueryResult<ApiResponse> => {
            return useQuery({
               ...(queryOptions as any), // @todo: fix typing
               queryKey: ["data", "entity", "media", { query }],
               queryFn: async () => {
                  return await this.api.data.readMany("media", query);
               }
            });
         },
         deleteFile: async (filename: string | { path: string }) => {
            const res = await this.api.media.deleteFile(
               typeof filename === "string" ? filename : filename.path
            );

            if (res.res.ok) {
               queryClient.invalidateQueries({ queryKey: ["data", "entity", "media"] });
               return true;
            }

            return false;
         }
      };
   };

   query = (options?: Partial<QueryObserverOptions>) => {
      const queryOptions = this.queryOptions(options);
      return {
         data: {
            entity: (name: string) => {
               return {
                  readOne: (
                     id: number,
                     query: Partial<Omit<RepoQuery, "where" | "limit" | "offset">> = {}
                  ): any => {
                     return useQuery({
                        ...queryOptions,
                        queryKey: ["data", "entity", name, id, { query }],
                        queryFn: async () => {
                           return await this.api.data.readOne(name, id, query);
                        }
                     });
                  },
                  readMany: (
                     query: Partial<RepoQuery> = { limit: 10, offset: 0 }
                  ): UseQueryResult<ApiResponse> => {
                     return useQuery({
                        ...(queryOptions as any), // @todo: fix typing
                        queryKey: ["data", "entity", name, { query }],
                        queryFn: async () => {
                           return await this.api.data.readMany(name, query);
                        }
                     });
                  },
                  readManyByReference: (
                     id: number,
                     reference: string,
                     referenced_entity?: string, // required for query invalidation
                     query: Partial<RepoQuery> = { limit: 10, offset: 0 }
                  ): UseQueryResult<Pick<RepositoryResponse, "meta" | "data">> => {
                     return useQuery({
                        ...(queryOptions as any), // @todo: fix typing
                        queryKey: [
                           "data",
                           "entity",
                           referenced_entity ?? reference,
                           { name, id, reference, query }
                        ],
                        queryFn: async () => {
                           return await this.api.data.readManyByReference(
                              name,
                              id,
                              reference,
                              query
                           );
                        }
                     });
                  },
                  count: (
                     where: RepoQuery["where"] = {}
                  ): UseQueryResult<ApiResponse<{ entity: string; count: number }>> => {
                     return useQuery({
                        ...(queryOptions as any), // @todo: fix typing
                        queryKey: ["data", "entity", name, "fn", "count", { where }],
                        queryFn: async () => {
                           return await this.api.data.count(name, where);
                        }
                     });
                  }
               };
            }
         }
      };
   };

   // @todo: centralize, improve
   __invalidate = (...args: any[]) => {
      console.log("___invalidate", ["data", "entity", ...args]);
      queryClient.invalidateQueries({ queryKey: ["data", "entity", ...args] });
   };

   // @todo: must return response... why?
   mutation = {
      data: {
         entity: (name: string) => {
            return {
               update: (id: number): any => {
                  return useMutation({
                     mutationFn: async (input: EntityData) => {
                        return await this.api.data.updateOne(name, id, input);
                     },
                     onSuccess: async () => {
                        await queryClient.invalidateQueries({ queryKey: ["data", "entity", name] });
                     }
                  });
               },
               create: (): any => {
                  return useMutation({
                     mutationFn: async (input: EntityData) => {
                        return await this.api.data.createOne(name, input);
                     },
                     onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ["data", "entity", name] });
                     }
                  });
               },
               delete: (id: number): any => {
                  return useMutation({
                     mutationFn: async () => {
                        return await this.api.data.deleteOne(name, id);
                     },
                     onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ["data", "entity", name] });
                     }
                  });
               }
            };
         }
      }
   };
}
