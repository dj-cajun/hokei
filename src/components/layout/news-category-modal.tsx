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

  const handleNavigation = (href: string) => {
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
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 -translate-y-1/2",
            "overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl outline-none",
            "focus:outline-none focus:ring-0",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "duration-200"
          )}
          onPointerDownOutside={() => onOpenChange(false)}
          onEscapeKeyDown={() => onOpenChange(false)}
          onClick={(e) => e.stopPropagation()}
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
            <DialogPrimitive.Title className="text-sm font-bold text-gray-800">
              뉴스 카테고리 선택
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="rounded-sm p-1 text-gray-400 transition-colors hover:text-black focus:outline-none focus:ring-0"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          <ul className="divide-y divide-gray-100">
            {NEWS_BOARD_ITEMS.map((board) => (
              <li key={board.slug}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-0"
                  onClick={() => handleNavigation(board.href)}
                >
                  <span>{board.title}</span>
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
