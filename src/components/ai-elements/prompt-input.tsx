import React, { useRef } from "react";
import { cn } from "@/lib/utils";

export interface PromptInputMessage {
  text: string;
}

interface PromptInputProps {
  onSubmit: (message: PromptInputMessage) => void;
  children: React.ReactNode;
  className?: string;
}

export function PromptInput({ onSubmit, children, className }: PromptInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const textarea = form.querySelector("textarea");
    if (textarea && textarea.value.trim()) {
      onSubmit({ text: textarea.value });
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      {children}
    </form>
  );
}

interface PromptInputTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSubmit?: () => void;
}

export function PromptInputTextarea({ className, onSubmit, onChange, ...props }: PromptInputTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    onChange?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <textarea
      ref={ref}
      rows={1}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={cn(
        "w-full resize-none overflow-hidden bg-zinc-900/80 border border-zinc-700/60",
        "rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-500",
        "focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600",
        "transition-colors leading-relaxed",
        className
      )}
      {...props}
    />
  );
}

interface PromptInputSubmitProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  status?: "ready" | "streaming";
}

export function PromptInputSubmit({ status = "ready", className, disabled, ...props }: PromptInputSubmitProps) {
  const isStreaming = status === "streaming";

  return (
    <button
      type="submit"
      disabled={disabled || isStreaming}
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
        "bg-zinc-700 hover:bg-zinc-600 text-zinc-200",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-700",
        className
      )}
      {...props}
    >
      {isStreaming ? (
        <svg
          className="w-4 h-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ) : (
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 2L11 13" />
          <path d="M22 2L15 22l-4-9-9-4 19-7z" />
        </svg>
      )}
    </button>
  );
}
