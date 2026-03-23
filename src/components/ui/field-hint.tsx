import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function FieldHint({ className, children, ...props }: ComponentProps<"p">) {
  if (children == null || children === "") return null;
  return (
    <p
      className={cn("m-0 text-xs text-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
}
