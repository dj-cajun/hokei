/** Google Search Console / AdSense HTML 태그 인증용 */
export function getGoogleSiteVerification(): string | undefined {
  const token = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  return token || undefined;
}
