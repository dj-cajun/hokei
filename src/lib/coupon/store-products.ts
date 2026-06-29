import { agencyLoginIdForStore } from "./config";
import type { ProductDto } from "./types";

export function isProductForStore(product: ProductDto, slug: string): boolean {
  const agencyLoginId = agencyLoginIdForStore(slug);
  if (!agencyLoginId) return true;
  return product.agencyLoginId === agencyLoginId;
}
