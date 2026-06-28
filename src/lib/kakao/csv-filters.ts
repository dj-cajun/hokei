/** CSV·카톡 원문에서 AI 분석 전 제거할 저가치 메시지 */

const PHOTO_ONLY = /^사진\s*\d*\s*장?\.?$/iu;
const VIDEO_ONLY = /^동영상\s*\d*\s*장?\.?$/iu;
const MEDIA_ONLY =
  /^(?:파일|이미지|GIF|음성|녹음)\s*\d*\s*장?\.?$/iu;
const EMOJICON_ONLY = /^이모티콘$/iu;
const STICKER_ONLY = /^스티커$/iu;
const DELETED = /^메시지(?:를)?\s*삭제(?:되)?(?:었)?(?:습니다)?\.?$/iu;
const CHAT_NOISE =
  /^[\sㅋㅎㅇㅋok네응감사수고ㅠ]+[.!~]*$/iu;
const OPENCHAT_GREETING =
  /^반갑습니다[.!]?[\s\S]{0,120}유익한 정보 얻어 가시길/iu;

const POLICY_BOILERPLATE =
  /사칭에 유의해 주세요|운영정책을 위반한 메시지|신고해 주시기 바랍니다/iu;

const DECORATOR_ONLY = /^[\s※\-_=~·ㅡ]+$/u;

function isTooShortWithoutSignal(text: string): boolean {
  if (text.includes("\n")) return false;
  if (text.length >= 14) return false;
  if (/\d{4,}/.test(text)) return false;
  if (/open\.kakao\.com|http|www\.|☎|전화|카톡|Zalo|만동|VND/i.test(text)) {
    return false;
  }
  return true;
}

export function isLowValueKakaoCsvMessage(message: string): boolean {
  const t = message.trim();
  if (!t) return true;
  if (PHOTO_ONLY.test(t)) return true;
  if (VIDEO_ONLY.test(t)) return true;
  if (MEDIA_ONLY.test(t)) return true;
  if (EMOJICON_ONLY.test(t)) return true;
  if (STICKER_ONLY.test(t)) return true;
  if (DELETED.test(t)) return true;
  if (CHAT_NOISE.test(t)) return true;
  if (DECORATOR_ONLY.test(t)) return true;
  if (OPENCHAT_GREETING.test(t)) return true;
  if (/^📢\s*광고야/.test(t) && t.length < 80) return true;

  if (POLICY_BOILERPLATE.test(t) && !/\d{5,}/.test(t)) {
    return true;
  }

  if (
    /^[\s\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d\ufe0f]+$/u.test(
      t
    )
  ) {
    return true;
  }

  return isTooShortWithoutSignal(t);
}

export function normalizeKakaoCsvMessageForDedupe(message: string): string {
  return message
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      if (DECORATOR_ONLY.test(line)) return false;
      if (/^[※\-_=~·ㅡ]{3,}$/.test(line)) return false;
      return true;
    })
    .join("\n")
    .replace(/\s+/g, " ")
    .trim();
}
