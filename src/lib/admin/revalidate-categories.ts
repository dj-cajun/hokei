import { revalidatePath } from "next/cache";

export function revalidateCategoryCaches() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/categories");
}
