import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
  size?: "sm" | "md";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60";
    const variants =
      variant === "outline"
        ? "border bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900"
        : "bg-primary text-primary-foreground hover:opacity-90";
    const sizes = size === "sm" ? "px-3 py-1.5" : "px-4 py-2";
    return (
      <button
        ref={ref}
        className={cn(base, variants, sizes, className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
