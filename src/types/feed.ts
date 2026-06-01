import type { PostTopic } from "@/generated/prisma/client";

export type ListCommentPreview = {
  authorName: string;
  content: string;
};

export interface FeedItem {
  id: string;
  category: string;
  categoryColor: string;
  title: string;
  /** 상대 시간 (2시간 전) */
  date: string;
  /** YYYY-MM-DD */
  dateLabel: string;
  isNew: boolean;
  views: number;
  comments: number;
  latestComment?: ListCommentPreview;
  thumbnail?: string;
  sourceUrl?: string;
  topic?: PostTopic;
}

export type FeedTab = "latest" | "popular" | "notice";

export type BoardPreviewItem = {
  id: string;
  title: string;
  href: string;
  dateLabel: string;
  isNew: boolean;
  commentCount?: number;
  views?: number;
  latestComment?: ListCommentPreview;
};

export type BoardPreviewTab = {
  id: string;
  label: string;
};

export type BoardPreviewSection = {
  title: string;
  href: string;
  accentClass: string;
  borderAccent: string;
  tabs?: BoardPreviewTab[];
  items: BoardPreviewItem[];
};
