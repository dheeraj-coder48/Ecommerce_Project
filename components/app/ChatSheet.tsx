"use client";

import { useChat } from "@ai-sdk/react";
import { useAuth } from "@clerk/nextjs";
import { DefaultChatTransport } from "ai";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useChatActions,
  useIsChatOpen,
  usePendingMessage,
} from "@/lib/store/chat-store-provider";

import {
  getMessageText,
  getToolParts,
  MessageBubble,
  ToolCallUI,
  WelcomeScreen,
} from "./chat";

export function ChatSheet() {
  const isOpen = useIsChatOpen();
  const { closeChat, clearPendingMessage } = useChatActions();
  const pendingMessage = usePendingMessage();
  const { isSignedIn } = useAuth();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const isLoading = status === "streaming" || status === "submitted";

  // Auto-scroll to bottom when new messages arrive or streaming updates
  // biome-ignore lint/correctness/useExhaustiveDependencies: trigger scroll on message/loading changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle pending message - send it when chat opens
  useEffect(() => {
    if (isOpen && pendingMessage && !isLoading) {
      sendMessage({ text: pendingMessage });
      clearPendingMessage();
    }
  }, [isOpen, pendingMessage, isLoading, sendMessage, clearPendingMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage({ text: input });
    setInput("");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - only visible on mobile/tablet (< xl) */}
      <div
        className="fixed inset-0 z-40 bg-black/50 xl:hidden"
        onClick={closeChat}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 z-50 flex h-[100dvh] w-full min-w-0 flex-col border-l border-[#dedbd3] bg-[#f8f7f3] overscroll-contain dark:border-zinc-800 dark:bg-zinc-950 sm:w-[448px] animate-in slide-in-from-right duration-300">
        {/* Header */}
        <header className="shrink-0 border-b border-[#e5e1d8] dark:border-zinc-800">
          <div className="flex h-16 items-center justify-between px-5 sm:px-6">
            <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">
              <Sparkles className="h-4 w-4 text-[#526556] dark:text-zinc-100" />
              AI Fashion Stylist
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeChat}
              aria-label="Close AI Fashion Stylist"
              className="h-10 w-10 rounded-sm text-zinc-600 transition-colors hover:bg-[#eeece6] hover:text-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {messages.length === 0 ? (
            <WelcomeScreen
              onSuggestionClick={sendMessage}
              isSignedIn={isSignedIn ?? false}
            />
          ) : (
            <div className="space-y-5">
              {messages.map((message) => {
                const content = getMessageText(message);
                const toolParts = getToolParts(message);
                const hasContent = content.length > 0;
                const hasTools = toolParts.length > 0;

                if (!hasContent && !hasTools) return null;

                return (
                  <div key={message.id} className="space-y-3">
                    {/* Tool call indicators */}
                    {hasTools &&
                      toolParts.map((toolPart) => (
                        <ToolCallUI
                          key={`tool-${message.id}-${toolPart.toolCallId}`}
                          toolPart={toolPart}
                          closeChat={closeChat}
                        />
                      ))}

                    {/* Message content */}
                    {hasContent && (
                      <MessageBubble
                        role={message.role}
                        content={content}
                        closeChat={closeChat}
                      />
                    )}
                  </div>
                );
              })}

              {/* Loading indicator */}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#dedbd3] bg-[#f1efe9] dark:border-zinc-700 dark:bg-zinc-900">
                    <Bot className="h-4 w-4 text-[#526556] dark:text-zinc-100" />
                  </div>
                  <div className="flex items-center gap-2 border-l border-[#c9b8a9] px-3 py-2">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#526556] [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#526556] [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#526556]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-[#e5e1d8] bg-[#f8f7f3] px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-zinc-800 dark:bg-zinc-950 sm:px-5">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for styling advice, fabrics, sizes..."
              disabled={isLoading}
              className="h-12 flex-1 rounded-sm border-[#d8d4cb] bg-white px-4 text-[13px] placeholder:text-zinc-400 focus-visible:border-[#526556] focus-visible:ring-1 focus-visible:ring-[#526556]/20 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              aria-label={isLoading ? "Sending message" : "Send message"}
              className="h-12 w-12 shrink-0 rounded-sm bg-[#292823] text-white transition-colors hover:bg-[#45443d] disabled:bg-[#d8d4cb] disabled:text-zinc-500 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
