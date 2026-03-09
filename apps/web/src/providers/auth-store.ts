import type { UserContext } from "../routes/__root";

// Imperative setter accessible outside React (e.g. route beforeLoad guards)
let _setUserContext: ((uc: UserContext | undefined) => void) | undefined;
let _updateUserContext: ((patch: Partial<UserContext>) => void) | undefined;

export function setUserContextImperative(uc: UserContext | undefined) {
  _setUserContext?.(uc);
}

export function updateUserContextImperative(patch: Partial<UserContext>) {
  _updateUserContext?.(patch);
}

export function registerAuthSetters(
  setter: (uc: UserContext | undefined) => void,
  updater: (patch: Partial<UserContext>) => void,
) {
  _setUserContext = setter;
  _updateUserContext = updater;
}

export function unregisterAuthSetters() {
  _setUserContext = undefined;
  _updateUserContext = undefined;
}
