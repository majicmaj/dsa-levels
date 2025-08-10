import * as React from "react";
import { cn } from "@/lib/utils";

export function Command({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="listbox"
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground",
        className
      )}
      {...props}
    />
  );
}

export function CommandInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <div className="flex items-center gap-2 border-b px-3 py-2">
      <input
        {...props}
        className={cn(
          "w-full bg-transparent outline-none placeholder:text-zinc-500",
          props.className
        )}
      />
      {props.children}
    </div>
  );
}

export function CommandList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("max-h-[60vh] overflow-auto p-2", className)}
      {...props}
    />
  );
}

export function CommandGroup({
  heading,
  children,
}: {
  heading?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2">
      {heading ? (
        <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {heading}
        </div>
      ) : null}
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

export function CommandItem({
  children,
  className,
  active,
  ...props
}: React.LiHTMLAttributes<HTMLLIElement> & { active?: boolean }) {
  return (
    <li
      {...props}
      className={cn(
        "flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900",
        active && "bg-zinc-50 dark:bg-zinc-900",
        className
      )}
    >
      {children}
    </li>
  );
}
