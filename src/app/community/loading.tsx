import { ListSkeleton } from "@/components/ui/skeleton";

export default function CommunityLoading() {
  return (
    <div className="mx-auto max-w-[480px]">
      <ListSkeleton rows={10} />
    </div>
  );
}
