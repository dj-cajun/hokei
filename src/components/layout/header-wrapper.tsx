import { getCategoryTree } from "@/lib/categories";
import { buildHeaderNavSections } from "@/lib/site-navigation";
import { Header } from "@/components/layout/header";

export async function HeaderWrapper() {
  const categoryTree = await getCategoryTree();
  const navSections = buildHeaderNavSections(categoryTree);
  return <Header categoryTree={categoryTree} navSections={navSections} />;
}
