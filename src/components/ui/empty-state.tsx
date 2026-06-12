import Link from "next/link";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
};

function EmptyIllustration() {
  return (
    <svg
      viewBox="0 0 120 96"
      className="mx-auto h-24 w-28 text-muted-foreground/40"
      aria-hidden
    >
      <rect
        x="24"
        y="12"
        width="72"
        height="56"
        rx="8"
        fill="currentColor"
        opacity="0.15"
      />
      <rect
        x="32"
        y="24"
        width="40"
        height="4"
        rx="2"
        fill="currentColor"
        opacity="0.35"
      />
      <rect
        x="32"
        y="34"
        width="56"
        height="4"
        rx="2"
        fill="currentColor"
        opacity="0.25"
      />
      <rect
        x="32"
        y="44"
        width="48"
        height="4"
        rx="2"
        fill="currentColor"
        opacity="0.2"
      />
      <circle cx="84" cy="68" r="14" fill="currentColor" opacity="0.12" />
      <path
        d="M78 68h8M82 64v8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <EmptyIllustration />
      <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {actionHref && actionLabel && (
        <Button asChild size="sm" className="mt-4">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
