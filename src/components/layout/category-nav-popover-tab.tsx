"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type CategoryPopoverItem = {
  label: string;
  href: string;
};

type CategoryNavPopoverTabProps = {
  label: string;
  items: CategoryPopoverItem[];
  open: boolean;
  active?: boolean;
  onToggle: () => void;
  onClose: () => void;
};

type PopoverCoords = { top: number; left: number };

export function CategoryNavPopoverTab({
  label,
  items,
  open,
  active = false,
  onToggle,
  onClose,
}: CategoryNavPopoverTabProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<PopoverCoords | null>(null);
  const canPortal = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, label]);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open, onClose]);

  const panel =
    open && coords ? (
      <div
        ref={panelRef}
        role="menu"
        style={{ top: coords.top, left: coords.left }}
        className={cn(
          "fixed z-[100] w-44 -translate-x-1/2",
          "overflow-hidden rounded-lg border border-border bg-surface shadow-xl",
          "animate-in fade-in zoom-in-95 duration-150 origin-top"
        )}
      >
        <ul className="divide-y divide-gray-100 py-1">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                role="menuitem"
                className="block px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-primary focus-ring active:bg-muted"
                onClick={onClose}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        className={cn(
          "flex items-center gap-0.5 border-b-2 px-3 py-2 text-sm transition-colors focus-ring",
          active || open
            ? "border-primary font-bold text-primary"
            : "border-transparent font-medium text-muted-foreground hover:text-foreground"
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span>{label}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {canPortal && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
