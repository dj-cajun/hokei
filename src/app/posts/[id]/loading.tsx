export default function PostLoading() {
  return (
    <div className="mx-auto max-w-[480px] animate-pulse space-y-3 p-4 lg:max-w-6xl">
      <div className="h-4 w-1/3 rounded bg-gray-100" />
      <div className="h-8 w-4/5 rounded bg-gray-100" />
      <div className="h-48 rounded-lg bg-gray-100" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-2/3 rounded bg-gray-100" />
      </div>
    </div>
  );
}
