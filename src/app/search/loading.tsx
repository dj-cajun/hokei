export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-[480px] animate-pulse p-4 lg:max-w-6xl">
      <div className="mb-4 h-8 rounded bg-gray-100" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="mb-2 h-14 rounded-lg bg-gray-100" />
      ))}
    </div>
  );
}
