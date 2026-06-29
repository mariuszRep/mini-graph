import React from "react";
import { cn } from "@/lib/utils";

interface MessageProps {
  from: "user" | "assistant";
  children: React.ReactNode;
  className?: string;
}

export function Message({ from, children, className }: MessageProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {from === "user" ? "User" : "Agent"}
      </span>
      {children}
    </div>
  );
}

export function MessageContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-1", className)}>{children}</div>;
}

export function MessageResponse({
  children,
  className,
}: {
  children: React.ReactNode;
  from?: "user" | "assistant";
  className?: string;
}) {
  return (
    <p className={cn("text-sm text-zinc-200 whitespace-pre-wrap break-words leading-relaxed", className)}>
      {children}
    </p>
  );
}
