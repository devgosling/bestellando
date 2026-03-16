import {
  type UndefinedInitialDataOptions,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { DefaultError, QueryKey } from "@tanstack/query-core";
import { authenticatedFetch, unauthenticatedFetch } from "@repo/lib";
import { type HandlerKey, useApiSideEffects } from "./useApiSideEffects";

type HandlerMap = Partial<Record<HandlerKey, (additional?: string) => void>>;

type RequestConfig = {
  url: string;
  requiresAuth?: boolean;
  autoLogout?: boolean;
  init?: RequestInit;
};

export function useApiQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  > & {
    handlers?: HandlerMap;
    success?: (response: TData) => void;
    request?: RequestConfig;
  },
): UseQueryResult<TData, TError> {
  const {
    handlers = {} as HandlerMap,
    success,
    request,
    ...reactQueryOptions
  } = options;

  const queryFnFromRequest =
    request && !reactQueryOptions.queryFn
      ? () => {
          const { url, requiresAuth = true, autoLogout = true, init } = request;

          return (
            requiresAuth
              ? authenticatedFetch(url, init, autoLogout)
              : unauthenticatedFetch(url, init)
          ) as Promise<TQueryFnData>;
        }
      : undefined;

  const queryKeyFromRequest =
    request && !reactQueryOptions.queryKey ? [request.url] : undefined;

  const result = useQuery({
    ...(queryFnFromRequest ? { queryFn: queryFnFromRequest } : {}),
    ...(queryKeyFromRequest
      ? { queryKey: queryKeyFromRequest as unknown as TQueryKey }
      : {}),
    ...reactQueryOptions,
  });

  useApiSideEffects({
    success,
    handlers,
    data: result.data,
    error: result.error,
  });

  return result;
}
