import type { PaginateOptions, PaginateResponse } from "./interfaces/Paginate";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import { appwriteAccount } from "../appwrite";
import { properties } from "../../consts/properties";

let cachedJwt: string | null = null;
let cachedJwtExpMs: number | null = null;
let jwtInFlight: Promise<string> | null = null;

function decodeJwtExpMs(jwt: string): number | null {
  const parts = jwt.split(".");
  if (parts.length < 2) return null;

  try {
    const payloadBase64Url = parts[1];
    const payloadBase64 = payloadBase64Url
      ?.replaceAll("-", "+")
      .replaceAll("_", "/");
    const padded = payloadBase64?.padEnd(
      payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4),
      "=",
    );

    const json = atob(padded!);
    const payload = JSON.parse(json) as { exp?: number };

    if (!payload.exp) return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

async function getValidJwt(): Promise<string> {
  const REFRESH_SKEW_MS = 60_000;

  if (cachedJwt && cachedJwtExpMs) {
    const remaining = cachedJwtExpMs - Date.now();
    if (remaining > REFRESH_SKEW_MS) {
      return cachedJwt;
    }
  }

  if (jwtInFlight) return jwtInFlight;

  jwtInFlight = (async () => {
    const { jwt } = await appwriteAccount.createJWT();
    cachedJwt = jwt;
    cachedJwtExpMs = decodeJwtExpMs(jwt);
    return jwt;
  })();

  try {
    return await jwtInFlight;
  } finally {
    jwtInFlight = null;
  }
}

export async function authenticatedFetch(
  url: string,
  init?: RequestInit,
  autoLogout = true,
): Promise<any> {
  try {
    const jwt = await getValidJwt();

    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${jwt}`);
    if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(properties.apiUrl + url, { ...init, headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: any = new Error(
        errorData.message || `Request failed with status ${response.status}`,
      );
      error.status = response.status;
      error.data = errorData;
      error.badRequestCode = errorData.badRequestCode;
      error.badRequestAdditional = errorData.badRequestAdditional;
      throw error;
    }

    return await response.json();
  } catch (error: any) {
    if (
      !autoLogout ||
      error.status === 400 ||
      error.status === 404 ||
      error.status === 403
    ) {
      throw error;
    }

    appwriteAccount
      .deleteSession({
        sessionId: "current",
      })
      .then(() => {
        location.href = "/";
      });
  }
}

export async function unauthenticatedFetch(
  url: string,
  init?: RequestInit,
): Promise<any> {
  const headers = new Headers(init?.headers);
  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(properties.apiUrl + url, { ...init, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: any = new Error(
      errorData.message || `Request failed with status ${response.status}`,
    );
    error.status = response.status;
    error.data = errorData;
    error.badRequestCode = errorData.badRequestCode;
    error.badRequestAdditional = errorData.badRequestAdditional;
    throw error;
  }

  return await response.json();
}

export const getInfiniteQueryOptions = <TData>(
  url: string,
  options?: Partial<PaginateOptions>,
  queryKey?: unknown[],
  requestOptions?: {
    requiresAuth?: boolean;
    autoLogout?: boolean;
  },
) => {
  const { requiresAuth = true, autoLogout = true } = requestOptions ?? {};

  return infiniteQueryOptions({
    queryKey: [...(queryKey ?? [url]), options],
    queryFn: ({ pageParam }) => {
      const searchParams = new URLSearchParams();

      if (options?.limit) searchParams.set("limit", options.limit.toString());
      if (options?.search) searchParams.set("search", options.search);
      if (options?.tag) searchParams.set("tag", options.tag);
      if (options?.category) searchParams.set("category", options.category);
      if (options?.type) searchParams.set("type", options.type);

      if (options?.dateSpan) {
        if (options.dateSpan.from)
          searchParams.set("from", options.dateSpan.from.toISOString());
        if (options.dateSpan.to)
          searchParams.set("to", options.dateSpan.to.toISOString());
      }

      searchParams.set("page", pageParam.toString());

      const separator = url.includes("?") ? "&" : "?";
      return (
        (requiresAuth
          ? authenticatedFetch(
              `${url}${separator}${searchParams.toString()}`,
              undefined,
              autoLogout,
            )
          : unauthenticatedFetch(
              `${url}${separator}${searchParams.toString()}`,
            )) as Promise<PaginateResponse<TData>>
      ).then((res) => ({
        ...res,
        meta: { ...res.meta, currentPage: Number(res.meta.currentPage) },
      }));
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { currentPage, totalPages } = lastPage.meta;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });
};

export const getQueryOptions = <TData>(
  url: string,
  queryKey?: unknown[],
  requestOptions?: {
    requiresAuth?: boolean;
    autoLogout?: boolean;
  },
) => {
  const { requiresAuth = true, autoLogout = true } = requestOptions ?? {};

  return queryOptions({
    queryKey: queryKey ?? [url],
    queryFn: () =>
      (requiresAuth
        ? authenticatedFetch(url, undefined, autoLogout)
        : unauthenticatedFetch(url)) as Promise<TData>,
  });
};

export const getMutationOptions = <TData, TVariables = any>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE" = "POST",
  bodyBuilder?: (variables: TVariables) => BodyInit | undefined,
  requestOptions?: {
    requiresAuth?: boolean;
    autoLogout?: boolean;
    init?: Omit<RequestInit, "method" | "body">;
  },
): UseMutationOptions<TData, Error, TVariables> => {
  const { requiresAuth = true, autoLogout = true, init } = requestOptions ?? {};

  return {
    mutationFn: (variables: TVariables) =>
      (requiresAuth
        ? authenticatedFetch(
            url,
            {
              ...init,
              method,
              body: bodyBuilder
                ? bodyBuilder(variables)
                : variables
                  ? JSON.stringify(variables)
                  : undefined,
            },
            autoLogout,
          )
        : unauthenticatedFetch(url, {
            ...init,
            method,
            body: bodyBuilder
              ? bodyBuilder(variables)
              : variables
                ? JSON.stringify(variables)
                : undefined,
          })) as Promise<TData>,
  };
};
