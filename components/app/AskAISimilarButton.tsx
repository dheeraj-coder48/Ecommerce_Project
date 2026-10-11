"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatActions } from "@/lib/store/chat-store-provider";

interface AskAISimilarButtonProps {
  productName: string;
  colors?: string[];
}

export function AskAISimilarButton({
  productName,
  colors = [],
}: AskAISimilarButtonProps) {
  const { openChatWithMessage } = useChatActions();

  const handleClick = () => {
    openChatWithMessage(
      `I'm viewing "${productName}"${colors.length ? `, which is available in ${colors.join(", ")}` : ""}. Can I get it in another color?`,
    );
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className="h-auto min-h-11 w-full whitespace-normal break-words px-2 py-2 text-center text-[9px] font-medium uppercase leading-snug tracking-[0.12em] rounded-none border-[#e5e2da] bg-transparent text-zinc-800 hover:border-zinc-950 hover:bg-zinc-950 hover:text-white dark:border-zinc-800 dark:text-zinc-200 dark:hover:border-white dark:hover:bg-white dark:hover:text-zinc-950 transition-all shadow-none sm:text-[11px] sm:tracking-[0.2em]"
    >
      <Sparkles className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white stroke-[1.5]" />
      Consult AI Stylist on Silhouettes & Shades
    </Button>
  );
}
