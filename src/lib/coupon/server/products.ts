import { prisma } from "@/lib/prisma";
import { CouponApiError } from "./errors";

export async function listActiveProducts(agencyLoginId?: string) {
  const products = await prisma.couponProduct.findMany({
    where: {
      isActive: true,
      ...(agencyLoginId
        ? { agency: { loginId: agencyLoginId } }
        : {}),
    },
    include: { agency: true },
    orderBy: { createdAt: "asc" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    imageUrl: p.imageUrl,
    agencyId: p.agencyId,
    agencyName: p.agency.name,
    agencyLoginId: p.agency.loginId,
  }));
}

export async function getProductById(id: string) {
  const product = await prisma.couponProduct.findFirst({
    where: { id, isActive: true },
    include: { agency: true },
  });
  if (!product) return null;
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    imageUrl: product.imageUrl,
    agencyId: product.agencyId,
    agencyName: product.agency.name,
    agencyLoginId: product.agency.loginId,
  };
}

export async function getProductByIdOrThrow(id: string) {
  const product = await getProductById(id);
  if (!product) {
    throw new CouponApiError(404, "NOT_FOUND", "Product not found");
  }
  return product;
}
