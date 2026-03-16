import { useEffect, useRef } from "react";
import { useNotification } from "./useNotification";

export type HandlerKey =
  | "OTHER"
  | "FORBIDDEN"
  | "USER_NOT_FOUND"
  | "USER_ALREADY_TEAM"
  | "NOT_FOUND"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_MIME_TYPE";
export type HandlerMap = Partial<
  Record<HandlerKey, (additional?: string) => void>
>;

type NormalizedError = {
  status?: number;
  badRequestCode?: HandlerKey;
  badRequestAdditional?: string;
};

export function useApiSideEffects<TData, TError>(params: {
  handlers?: HandlerMap;
  success?: (response: TData) => void;
  data: TData | undefined | null;
  error: TError | undefined | null;
}) {
  const { handlers = {}, success, data, error } = params;

  const { addNotification } = useNotification();

  const handlersRef = useRef<HandlerMap>(handlers);
  const successRef = useRef<typeof success>(success);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    successRef.current = success;
  }, [success]);

  const lastErrorRef = useRef<unknown>(null);
  const lastSuccessRef = useRef<unknown>(null);

  useEffect(() => {
    if (data == null || lastSuccessRef.current === data) return;
    lastSuccessRef.current = data;

    const cb = successRef.current;
    if (cb) cb(data as TData);
  }, [data]);

  useEffect(() => {
    if (!error || lastErrorRef.current === error) return;
    lastErrorRef.current = error;

    const e = error as NormalizedError;

    if (e.status === 400 && e.badRequestCode) {
      const handler = handlersRef.current[e.badRequestCode];
      if (handler) handler(e.badRequestAdditional || undefined);
      if (!handler)
        addNotification({
          type: "ERROR",
          title: "Unbekannter Fehler aufgetreten",
        });
      return;
    }

    if (e.status === 400 && !e.badRequestCode) {
      addNotification({
        type: "ERROR",
        title: "Unbekannter Fehler aufgetreten",
      });
      return;
    }

    if (e.status === 404) {
      const handler = handlersRef.current["NOT_FOUND"];
      if (handler) handler();
      if (!handler)
        addNotification({
          type: "ERROR",
          title: "Resource nicht gefunden",
        });
      return;
    }

    if (e.status === 403) {
      const handler = handlersRef.current["FORBIDDEN"];
      if (handler) handler();
      if (!handler)
        addNotification({
          type: "ERROR",
          title: "Fehlende Berechtigung",
        });
      return;
    }

    if (!e.status) {
      const handler = handlersRef.current["OTHER"];
      if (handler) handler();
      if (!handler)
        addNotification({
          type: "ERROR",
          title: "Unbekannter Fehler aufgetreten",
        });
    }
  }, [addNotification, error]);
}
