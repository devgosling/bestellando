import { SetMetadata } from "@nestjs/common";

export const COOLDOWN_KEY = "cooldown";
export const Cooldown = (seconds: number) => SetMetadata(COOLDOWN_KEY, seconds);
