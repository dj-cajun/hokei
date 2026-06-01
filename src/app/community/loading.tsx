export default function CommunityLoading() {
  return (
    <div className="mx-auto max-w-[480px] animate-pulse bg-white">
      <div className="h-12 border-b border-gray-100 bg-gray-50" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-16 border-b border-gray-50 bg-gray-50/50" />
      ))}
    </div>
  );
}
