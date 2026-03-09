export function patchRouterContext<
  TRouteOptions extends { context: TContext },
  TContext,
>(options: TRouteOptions, contextPatch: Partial<TContext>): TRouteOptions {
  return {
    ...options,
    context: {
      ...options.context,
      ...contextPatch,
    },
  };
}

export function patchUserContext<
  TRouteOptions extends {
    context: {
      userContext?: unknown;
    };
  },
>(
  options: TRouteOptions,
  userContextPatch:
    | (NonNullable<TRouteOptions["context"]["userContext"]> extends object
        ? Partial<NonNullable<TRouteOptions["context"]["userContext"]>>
        : never)
    | undefined,
): TRouteOptions {
  return patchRouterContext(options, {
    userContext:
      userContextPatch === undefined
        ? undefined
        : {
            ...(options.context.userContext as object | undefined),
            ...userContextPatch,
          },
  } as Partial<TRouteOptions["context"]>);
}
