export type CategoryNavItem = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  href: string;
  icon: string;
  colorClass: string;
  children: CategoryNavItem[];
};
