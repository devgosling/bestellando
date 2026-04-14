import {
  Switch,
  SwitchContent,
  SwitchControl,
  SwitchThumb,
} from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

type SwitchProps = ComponentProps<typeof Switch>;

interface ToggleSwitchProps extends Omit<SwitchProps, "children"> {
  children?: ReactNode;
}

export function ToggleSwitch({ children, ...props }: ToggleSwitchProps) {
  return (
    <Switch {...props}>
      <SwitchControl>
        <SwitchThumb />
      </SwitchControl>
      {children !== undefined && children !== null && children !== false && (
        <SwitchContent>{children}</SwitchContent>
      )}
    </Switch>
  );
}
