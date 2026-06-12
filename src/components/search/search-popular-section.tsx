import Link from "next/link";
import { getPopularSearchQueries } from "@/lib/search/popular-searches";

export async function SearchPopularSection() {
  const popular = await getPopularSearchQueries(10);

  if (popular.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-border-light px-3 py-4">
      <h2 className="text-xs font-semibold text-muted-foreground">인기 검색어</h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {popular.map((item, index) => (
          <li key={item.query}>
            <Link
              href={`/search?q=${encodeURIComponent(item.query)}`}
              className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-3 py-1 text-xs text-foreground transition-colors hover:bg-card-hover"
            >
              <span className="font-semibold text-primary">{index + 1}</span>
              {item.query}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
