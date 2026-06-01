import {
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  CalendarRange,
  Folder,
  GraduationCap,
  HelpCircle,
  Home,
  MessageCircle,
  MessagesSquare,
  Newspaper,
  Package,
  PenLine,
  Radio,
  ScrollText,
  Search,
  Store,
  Tags,
  UserPlus,
  Users,
} from "lucide-react";

const ICONS = {
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
} as const;

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? Folder;
  return <Icon className={className} />;
}
