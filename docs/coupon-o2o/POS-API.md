# POS · 키오스크 연동 (Phase G-04)

## 1. 키오스크 (호케이 UI)

| URL | 용도 |
|-----|------|
| `/account/partner/coupon/kiosk` | 전체화면 스캐너 (카메라 · POS 웨지 입력) |

- Agency SSO + 직원 PIN 필요 (기존 Phase E)
- 태블릿을 카운터에 고정해 사용

## 2. POS API (coupon-pilot)

외부 POS·키오스크·스크립트가 **Agency JWT 없이** 스캔할 때 사용합니다.

### 기기 등록

1. manager PIN 로그인
2. `/account/partner/coupon/pos` → **API 키 발급**
3. 키는 **한 번만** 표시 — 안전하게 POS에 저장

### 스캔

```http
POST {COUPON_API_URL}/pos/scan
X-Pos-Api-Key: pos_xxxxxxxx
Content-Type: application/json

{ "qrPayload": "..." }
```

응답 형식은 `POST /redemptions/scan`과 동일합니다.

### 감사 로그

`CouponAuditLog.metadata`에 `posDeviceId`, `posDeviceName` 기록.

### 데모 (로컬 seed)

```
기기명: 카운터 POS (데모)
키: pos_demo_2d_sketch_cafe
```

## 3. 비활성화

Partner UI에서 **비활성화** 또는 `DELETE /pos/devices/:id` (manager + Agency JWT).

관련: [INTEGRATION.md](./INTEGRATION.md)
