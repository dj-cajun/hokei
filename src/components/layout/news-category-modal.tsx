"use client";

import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronRight, X } from "lucide-react";
import { NEWS_BOARD_ITEMS } from "@/lib/news-boards";
import { cn } from "@/lib/utils";

type NewsCategoryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewsCategoryModal({ open, onOpenChange }: NewsCategoryModalProps) {
  const router = useRouter();

  const goToBoard = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
          onClick={() => onOpenChange(false)}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2",
            "rounded-lg border border-[#e5e7eb] bg-white shadow-lg outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]",
            "duration-200"
          )}
          onPointerDownOutside={() => onOpenChange(false)}
          onEscapeKeyDown={() => onOpenChange(false)}
          onClick={(e) => e.stopPropagation()}
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
            <DialogPrimitive.Title className="text-base font-bold text-foreground">
              뉴스 게시판
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="rounded-sm p-1 text-gray-500 hover:bg-gray-50"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          <ul className="divide-y divide-[#f3f4f6] py-1">
            {NEWS_BOARD_ITEMS.map((board) => (
              <li key={board.slug}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left active:bg-gray-50"
                  onClick={() => goToBoard(board.href)}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {board.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {board.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                </button>
              </li>
            ))}
          </ul>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
