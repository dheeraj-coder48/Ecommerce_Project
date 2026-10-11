import { Bot, User } from "lucide-react";
import { MessageContent } from "./MessageContent";

interface MessageBubbleProps {
  role: string;
  content: string;
  closeChat: () => void;
}

export function MessageBubble({
  role,
  content,
  closeChat,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center ${
          isUser
            ? "bg-[#292823] dark:bg-zinc-100"
            : "border border-[#dedbd3] bg-[#f1efe9] dark:border-zinc-700 dark:bg-zinc-900"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white dark:text-zinc-900" />
        ) : (
          <Bot className="h-4 w-4 text-[#526556] dark:text-zinc-100" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={`max-w-[82%] break-words px-4 py-3 text-[13px] leading-6 ${
          isUser
            ? "bg-[#292823] text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "border-l border-[#c9b8a9] bg-transparent text-zinc-800 dark:text-zinc-100"
        }`}
      >
        <MessageContent
          content={content}
          closeChat={closeChat}
          isUser={isUser}
        />
      </div>
    </div>
  );
}
