import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function FieldError({ className, id, children, ...props }: ComponentProps<"p">) {
  if (children == null || children === "") return null;
  return (
    <p
      id={id}
      role="alert"
      className={cn("m-0 text-sm text-[var(--color-error-1)]", className)}
      {...props}
    >
      {children}
    </p>
  );
}
