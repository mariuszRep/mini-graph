import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Download, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ConversationContextValue {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  atBottom: boolean;
  setAtBottom: (v: boolean) => void;
  scrollToBottom: () => void;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

function useConversationContext() {
  const ctx = useContext(ConversationContext);
  if (!ctx) throw new Error("Must be used inside <Conversation>");
  return ctx;
}

export function Conversation({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  return (
    <ConversationContext.Provider value={{ scrollRef, atBottom, setAtBottom, scrollToBottom }}>
      <div className={cn("relative flex flex-col h-full w-full", className)}>
        {children}
      </div>
    </ConversationContext.Provider>
  );
}

export function ConversationContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { scrollRef, atBottom, setAtBottom, scrollToBottom } = useConversationContext();
  const childCountRef = useRef(0);

  // Auto-scroll when new children are added and we're already at bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const count = React.Children.count(children);
    if (count !== childCountRef.current) {
      childCountRef.current = count;
      if (atBottom) scrollToBottom();
    }
  });

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 40;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < threshold);
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className={cn(
        "flex-1 overflow-y-auto flex flex-col gap-3 p-4 scroll-smooth",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ConversationEmptyState({
  icon,
  title,
  description,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center flex-1 gap-3 text-center py-16 px-6",
        className
      )}
    >
      {icon && <div className="text-zinc-600">{icon}</div>}
      <p className="text-sm font-semibold text-zinc-300">{title}</p>
      {description && (
        <p className="text-xs text-zinc-500 max-w-xs">{description}</p>
      )}
    </div>
  );
}

export function ConversationDownload({
  messages,
  className,
}: {
  messages: { id: string; role: string; parts: { type: string; text?: string }[] }[];
  className?: string;
}) {
  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(messages, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (messages.length === 0) return null;

  return (
    <div className={cn("flex justify-end px-4 pb-1", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        className="h-7 gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
      >
        <Download size={12} />
        Download
      </Button>
    </div>
  );
}

export function ConversationScrollButton({ className }: { className?: string }) {
  const { atBottom, scrollToBottom } = useConversationContext();

  if (atBottom) return null;

  return (
    <button
      onClick={scrollToBottom}
      className={cn(
        "absolute bottom-20 right-6 z-10 flex items-center justify-center w-8 h-8 rounded-full",
        "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700",
        "shadow-lg transition-colors",
        className
      )}
    >
      <ChevronDown size={16} />
    </button>
  );
}
