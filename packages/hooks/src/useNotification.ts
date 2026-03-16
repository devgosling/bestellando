import * as HeroUI from "@heroui/react";
import type { ReactNode } from "react";

type ToastApi = {
  (message: ReactNode, options?: Record<string, unknown>): string;
  success: (message: ReactNode, options?: Record<string, unknown>) => string;
  danger: (message: ReactNode, options?: Record<string, unknown>) => string;
  warning: (message: ReactNode, options?: Record<string, unknown>) => string;
  info: (message: ReactNode, options?: Record<string, unknown>) => string;
  close: (key: string) => void;
  clear: () => void;
};

const heroUIRecord = HeroUI as Record<string, unknown>;
const toastFromRoot = heroUIRecord.toast as ToastApi | undefined;
const toastFromNamespace = (
  heroUIRecord.Toast as Record<string, unknown> | undefined
)?.toast as ToastApi | undefined;
const resolvedToast = toastFromRoot ?? toastFromNamespace;

type BaseNotificationOptions = Record<string, unknown>;
type VariantNotificationOptions = Omit<BaseNotificationOptions, "severity">;
type NotificationType = "SUCCESS" | "ERROR" | "WARNING" | "INFO" | "DEFAULT";

export type NotificationPayload = {
  title: ReactNode;
  description?: ReactNode;
};

export type AddNotificationPayload = NotificationPayload & {
  type?: NotificationType;
};

const resolveContent = (message: ReactNode | NotificationPayload) => {
  if (typeof message === "object" && message !== null && "title" in message) {
    return {
      title: message.title,
      description: message.description,
    };
  }

  return {
    title: message,
  };
};

export const useNotification = () => {
  const toast = resolvedToast;

  const safeCall = (callback: (api: ToastApi) => string): string => {
    if (!toast) {
      if (typeof console !== "undefined") {
        console.warn(
          "HeroUI toast API is unavailable. Notification was skipped.",
        );
      }

      return "";
    }

    return callback(toast);
  };

  const show = (
    message: ReactNode | NotificationPayload,
    options?: BaseNotificationOptions,
  ) => {
    const content = resolveContent(message);

    return safeCall((api) =>
      api(content.title, {
        ...options,
        description: content.description,
      }),
    );
  };

  const success = (
    message: ReactNode | NotificationPayload,
    options?: VariantNotificationOptions,
  ) => {
    const content = resolveContent(message);

    return safeCall((api) =>
      api.success(content.title, {
        ...options,
        description: content.description,
      }),
    );
  };

  const error = (
    message: ReactNode | NotificationPayload,
    options?: VariantNotificationOptions,
  ) => {
    const content = resolveContent(message);

    return safeCall((api) =>
      api.danger(content.title, {
        ...options,
        description: content.description,
      }),
    );
  };

  const warning = (
    message: ReactNode | NotificationPayload,
    options?: VariantNotificationOptions,
  ) => {
    const content = resolveContent(message);

    return safeCall((api) =>
      api.warning(content.title, {
        ...options,
        description: content.description,
      }),
    );
  };

  const info = (
    message: ReactNode | NotificationPayload,
    options?: VariantNotificationOptions,
  ) => {
    const content = resolveContent(message);

    return safeCall((api) =>
      api.info(content.title, {
        ...options,
        description: content.description,
      }),
    );
  };

  const addNotification = (
    payload: AddNotificationPayload,
    options?: VariantNotificationOptions,
  ) => {
    const { type = "DEFAULT", ...message } = payload;

    if (type === "SUCCESS") return success(message, options);
    if (type === "ERROR") return error(message, options);
    if (type === "WARNING") return warning(message, options);
    if (type === "INFO") return info(message, options);

    return show(message, options);
  };

  const dismiss = (key: string) => {
    if (toast) {
      toast.close(key);
    }
  };

  const clear = () => {
    if (toast) {
      toast.clear();
    }
  };

  return {
    show,
    success,
    error,
    warning,
    info,
    addNotification,
    dismiss,
    clear,
  };
};
