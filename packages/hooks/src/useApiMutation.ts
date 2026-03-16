import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import type { DefaultError } from "@tanstack/query-core";
import { authenticatedFetch, unauthenticatedFetch } from "@repo/lib";
import { type HandlerKey, useApiSideEffects } from "./useApiSideEffects";

type HandlerMap = Partial<Record<HandlerKey, (additional?: string) => void>>;
type MutationMethod = "POST" | "PUT" | "PATCH" | "DELETE";

type RequestConfig<TVariables> = {
  url: string;
  method?: MutationMethod;
  bodyBuilder?: (variables: TVariables) => BodyInit | undefined;
  requiresAuth?: boolean;
  autoLogout?: boolean;
  init?: Omit<RequestInit, "method" | "body">;
};

export function useApiMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext> & {
    handlers?: HandlerMap;
    success?: (response: TData) => void;
    request?: RequestConfig<TVariables>;
  },
): UseMutationResult<TData, TError, TVariables, TContext> {
  const {
    handlers = {} as HandlerMap,
    success,
    request,
    ...reactQueryOptions
  } = options;

  const mutationFnFromRequest =
    request && !reactQueryOptions.mutationFn
      ? (variables: TVariables) => {
          const {
            url,
            method = "POST",
            bodyBuilder,
            requiresAuth = true,
            autoLogout = true,
            init,
          } = request;

          const body = bodyBuilder
            ? bodyBuilder(variables)
            : variables
              ? JSON.stringify(variables)
              : undefined;

          return (
            requiresAuth
              ? authenticatedFetch(url, { ...init, method, body }, autoLogout)
              : unauthenticatedFetch(url, { ...init, method, body })
          ) as Promise<TData>;
        }
      : undefined;

  const result = useMutation({
    ...(mutationFnFromRequest ? { mutationFn: mutationFnFromRequest } : {}),
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
