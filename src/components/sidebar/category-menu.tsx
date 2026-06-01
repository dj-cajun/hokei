import { getCategoryTree } from "@/lib/categories";
import { CategoryMenuClient } from "@/components/sidebar/category-menu-client";

export async function CategoryMenu() {
  const tree = await getCategoryTree();
  return <CategoryMenuClient tree={tree} />;
}
