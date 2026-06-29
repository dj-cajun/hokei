# Zalo · VietQR (Phase G-03)

## VietQR 결제 QR

checkout 시 API가 `vietQrImageUrl`을 반환합니다 (`img.vietqr.io`).

| 필드 | 설명 |
|------|------|
| `bankAcqId` | 은행 BIN (예: Vietcombank `970436`) |
| `vietQrImageUrl` | 금액·입금자명(`CAFE-xxxxxxxx`) 포함 QR 이미지 |
| `transferNote` | 입금 내용 — 웹훅 매칭 키 |

미지원 은행: `VIETQR_DEFAULT_ACQ_ID` env (coupon API) 또는 계좌 정보 수동 송금.

## VietQR 웹훅 (기존)

`POST /webhooks/payment/vietqr` — [INTEGRATION.md](./INTEGRATION.md)

## Zalo

| 기능 | 구현 |
|------|------|
| OG 메타 | `/store/[slug]/coupon/layout.tsx` |
| Zalo 공유 | `ZaloShareButton` — `button-share.zalo.me` |
| 인앱 UI | `isZaloInAppBrowser` — checkout 좁은 레이아웃 + 안내 |

Zalo 미니앱 네이티브 SDK · OAuth는 **법무·G-02** 후 별도 (현재는 호케이 웹 URL 공유).

관련: [ZALO-TMDT.md](./ZALO-TMDT.md)
