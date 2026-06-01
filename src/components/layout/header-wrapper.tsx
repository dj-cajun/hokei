import { getCategoryTree } from "@/lib/categories";
import { Header } from "@/components/layout/header";

export async function HeaderWrapper() {
  const categoryTree = await getCategoryTree();
  return <Header categoryTree={categoryTree} />;
}
