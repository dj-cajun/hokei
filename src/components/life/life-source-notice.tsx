type LifeSourceNoticeProps = {
  isCrawl: boolean;
  domainStudy?: boolean;
};

export function LifeSourceNotice({ isCrawl, domainStudy }: LifeSourceNoticeProps) {
  if (domainStudy && isCrawl) {
    return (
      <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        💡 이 콘텐츠는 카카오톡 단톡방의 매일 베트남어 학습 내용을 AI가 정제한
        자료입니다. 매일 새로운 표현을 업데이트하고 있습니다.
      </p>
    );
  }

  if (domainStudy && !isCrawl) {
    return (
      <p className="mt-3 rounded-lg border border-border bg-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        💡 호케이 회원이 직접 공유한 현지 생활 베트남어 꿀팁입니다.
      </p>
    );
  }

  return null;
}
