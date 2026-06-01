import {
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  CalendarRange,
  ScrollText,
  Folder,
  GraduationCap,
  HelpCircle,
  Home,
  LayoutGrid,
  MessageCircle,
  MessagesSquare,
  Newspaper,
  Package,
  PenLine,
  Radio,
  Search,
  Store,
  Tags,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutGrid,
  Newspaper,
  Radio,
  ScrollText,
  GraduationCap,
  PenLine,
  Building2,
  Home,
  CalendarRange,
  Users,
  Tags,
  Package,
  Bike,
  Store,
  Briefcase,
  UserPlus,
  Search,
  MessageCircle,
  MessagesSquare,
  HelpCircle,
  BookOpen,
  Folder,
};

export type CategoryIconName = keyof typeof ICON_MAP;

export function getCategoryIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Folder;
}
