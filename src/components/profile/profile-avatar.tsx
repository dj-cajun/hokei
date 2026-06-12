import Image from "next/image";
import { cn } from "@/lib/utils";

type ProfileAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: "md" | "lg";
  className?: string;
};

const sizeClass = {
  md: "h-16 w-16 text-xl rounded-2xl",
  lg: "h-20 w-20 text-2xl rounded-2xl",
} as const;

export function ProfileAvatar({
  name,
  avatarUrl,
  size = "md",
  className,
}: ProfileAvatarProps) {
  const initial = name.charAt(0) || "?";

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={`${name} 프로필`}
        width={size === "lg" ? 80 : 64}
        height={size === "lg" ? 80 : 64}
        className={cn(
          "shrink-0 object-cover",
          sizeClass[size],
          className
        )}
        unoptimized
      />
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center bg-primary font-bold text-white",
        sizeClass[size],
        className
      )}
    >
      {initial}
    </span>
  );
}
