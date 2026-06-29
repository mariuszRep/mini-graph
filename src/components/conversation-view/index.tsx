import { useState } from "react";
import { GraphFeed, GraphNode } from "@/components/ui/graph-feed";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { useChat } from "@/hooks/use-chat";
const USER_COLOR = "hsl(var(--chart-4))";
const AGENT_COLOR = "hsl(var(--chart-1))";

export function ConversationView() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text.trim()) {
      sendMessage({ text: message.text });
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Graph area */}
      <div className="flex-1 min-h-0 flex flex-col bg-[#09090b] rounded-xl border border-zinc-800/80 shadow-2xl overflow-hidden">
        {/* Feed */}
        <div className="flex-1 overflow-auto">
          <GraphFeed className="font-sans text-zinc-100">
            {messages.map((msg, i) => {
              const isLast = i === messages.length - 1;
              const text = msg.parts.find((p) => p.type === "text")?.text ?? "";
              return (
                <GraphNode
                  key={msg.id}
                  color={msg.role === "user" ? USER_COLOR : AGENT_COLOR}
                  active={isLast}
                  streaming={isLast && status === "streaming" && msg.role === "assistant"}
                >
                  <span className="text-xs whitespace-pre-wrap break-words">{text}</span>
                </GraphNode>
              );
            })}
          </GraphFeed>
        </div>
      </div>

      {/* Prompt input */}
      <div className="px-4 pb-4 pt-3 border-t border-zinc-800/80 shrink-0 bg-[#09090b]">
        <PromptInput onSubmit={handleSubmit} className="relative">
          <PromptInputTextarea
            value={input}
            placeholder="Send a message…"
            onChange={(e) => setInput(e.currentTarget.value)}
            className="pr-12"
          />
          <PromptInputSubmit
            status={status === "streaming" ? "streaming" : "ready"}
            disabled={!input.trim()}
            className="absolute bottom-2 right-2"
          />
        </PromptInput>
      </div>
    </div>
  );
}
