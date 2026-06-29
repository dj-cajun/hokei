# Zalo OA · TMĐT (Phase G-02)

> 법무·현지 법인 검토 전 체크리스트. 코드 연동은 G-03.

## 1. 법인·등록

- [ ] 베트남 TNHH 설립 또는 기존 법인 확인
- [ ] TMĐT(전자상거래) 신고 — [congthuong.gov.vn](https://online.gov.vn/)
- [ ] 개인정보 처리 방침(베트남어) 게시
- [ ] LEGAL.md §2 구매자 약관 베트남어 번역·검토

## 2. Zalo Official Account

- [ ] Zalo OA 개설 (업소 또는 플랫폼 명의)
- [ ] ZNS(알림) 템플릿 — 결제 완료·쿠폰 발급 (선택)
- [ ] 미니앱 검토 (G-03) — 호케이 웹뷰 vs Zalo Mini App

## 3. 결제·세금

- [ ] VietQR 상호명·계좌 = 업소 명의 (현 구조 유지)
- [ ] 플랫폼 수수료 Hóa đơn 발행 주체 (K BROTHERS)
- [ ] 주간 정산 송금 영수증 보관 — [OPERATIONS.md](./OPERATIONS.md)

## 4. 호케이 연동 준비 (G-03)

| 항목 | 현재 | 목표 |
|------|------|------|
| 구매 진입 | `hokei.vn/store/{slug}/coupon` | Zalo 링크 동일 URL |
| 알림 | 호케이 쪽지 `/messages` | Zalo ZNS (선택) |
| 인증 | 호케이 로그인 | Zalo OAuth (검토) |

## 5. 담당·일정

| 단계 | 담당 | 비고 |
|------|------|------|
| 법인·TMĐT | 현지 법무 | 인간 필수 |
| Zalo OA | 마케팅·업소 | |
| 기술 G-03 | 개발 | API 변경 최소화 우선 |

관련: [LEGAL.md](./LEGAL.md) · [PHASE-G.md](./PHASE-G.md)
