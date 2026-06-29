import { useState } from "react";

export interface UIMessagePart {
  type: "text";
  text: string;
}

export interface UIMessage {
  id: string;
  role: "user" | "assistant";
  parts: UIMessagePart[];
  createdAt: number;
}

type ChatStatus = "ready" | "streaming";

interface UseChatReturn {
  messages: UIMessage[];
  sendMessage: (msg: { text: string }) => void;
  status: ChatStatus;
}

const MOCK_REPLIES = [
  "I've analyzed the request. Running tool calls to gather relevant context before proceeding with the execution plan.",
  "Understood. I'll break this into subtasks and delegate to the appropriate agent nodes. Forking a new execution branch now.",
  "Processing complete. The tool returned 3 relevant results. Synthesizing into a coherent response for the next step.",
  "Invoking the retrieval tool to fetch up-to-date information. This may take a moment — I'll stream results as they arrive.",
  "I see a few possible approaches here. I'm selecting the most efficient path and will execute it step by step.",
  "The previous node output looks good. I'm passing it downstream and continuing with the next phase of the workflow.",
  "Analysis done. There are two edge cases worth noting — I'll handle them in the next tool call before finalizing.",
  "Routing this to the specialized sub-agent. Expect a follow-up message once the delegated task completes.",
];

let replyIndex = 0;

function nextReply(): string {
  const reply = MOCK_REPLIES[replyIndex % MOCK_REPLIES.length];
  replyIndex++;
  return reply;
}

function generateId(): string {
  return Math.random().toString(16).substring(2, 10);
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("ready");

  const sendMessage = ({ text }: { text: string }) => {
    if (status === "streaming") return;

    const userMessage: UIMessage = {
      id: generateId(),
      role: "user",
      parts: [{ type: "text", text }],
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setStatus("streaming");

    const delay = 600 + Math.random() * 600;
    setTimeout(() => {
      const assistantMessage: UIMessage = {
        id: generateId(),
        role: "assistant",
        parts: [{ type: "text", text: nextReply() }],
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStatus("ready");
    }, delay);
  };

  return { messages, sendMessage, status };
}
