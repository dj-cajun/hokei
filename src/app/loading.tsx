import { FeedSkeleton } from "@/components/ui/skeleton";

export default function GlobalLoading() {
  return (
    <div className="mx-auto w-full max-w-[480px] lg:max-w-6xl">
      <FeedSkeleton rows={8} />
    </div>
  );
}
