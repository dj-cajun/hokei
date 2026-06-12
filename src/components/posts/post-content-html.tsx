"use client";

import { useState, type MouseEvent } from "react";
import { ImageLightbox } from "@/components/ui/image-lightbox";

type PostContentHtmlProps = {
  html: string;
  className?: string;
};

export function PostContentHtml({ html, className }: PostContentHtmlProps) {
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(
    null
  );

  function handleClick(e: MouseEvent<HTMLDivElement>) {
    const target = e.target;
    if (!(target instanceof HTMLImageElement)) return;

    const container = e.currentTarget;
    const imgs = Array.from(container.querySelectorAll("img"));
    const urls = imgs.map((img) => img.src).filter(Boolean);
    const index = urls.indexOf(target.src);
    if (index >= 0) {
      setLightbox({ urls, index });
    }
  }

  return (
    <>
      <div
        className={`post-content text-sm leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_img]:my-2 [&_img]:max-w-full [&_img]:cursor-zoom-in [&_img]:rounded-lg [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 ${className ?? ""}`}
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={handleClick}
      />
      {lightbox && (
        <ImageLightbox
          urls={lightbox.urls}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(index) =>
            setLightbox((prev) => (prev ? { ...prev, index } : null))
          }
        />
      )}
    </>
  );
}
