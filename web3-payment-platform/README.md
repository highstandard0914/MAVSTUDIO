# Web3Pay — 암호화폐 결제 플랫폼

지갑 연결만으로 가입하고, 입금·출금·결제가 가능한 Web3 기반 결제 플랫폼입니다.

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | Next.js 14, TypeScript, Tailwind CSS |
| 백엔드 | Next.js API Routes (Node.js) |
| 데이터베이스 | PostgreSQL + Prisma ORM |
| 지갑 연결 | wagmi v2, viem |
| Web3 | ethers.js v6 (HD Wallet) |
| 인증 | SIWE (Sign-In with Ethereum) + JWT |

## 시작하기

### 1. 의존성 설치

```bash
cd web3-payment-platform
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 수정하세요:

```env
# PostgreSQL 연결
DATABASE_URL="postgresql://user:password@localhost:5432/web3_payment"

# JWT 시크릿 (openssl rand -base64 32)
JWT_SECRET="your-secret-key"

# 마스터 지갑 니모닉 (12단어)
MASTER_WALLET_MNEMONIC="your twelve word mnemonic phrase here"

# Infura/Alchemy RPC URL
ETH_RPC_URL="https://sepolia.infura.io/v3/YOUR_KEY"

# WalletConnect 프로젝트 ID (cloud.walletconnect.com에서 발급)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-project-id"

# 관리자 지갑 주소 (콤마로 여러 개 가능)
ADMIN_WALLET_ADDRESSES="0xYourAdminAddress"
```

### 3. 마스터 지갑 생성

```js
// Node.js에서 실행
const { ethers } = require("ethers");
const wallet = ethers.Wallet.createRandom();
console.log("Mnemonic:", wallet.mnemonic.phrase);
console.log("Address:", wallet.address);
```

### 4. 데이터베이스 설정

```bash
npm run db:push     # 스키마 적용
npm run db:generate # Prisma 클라이언트 생성
```

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 페이지 구성

| 경로 | 설명 |
|------|------|
| `/` | 메인 랜딩 페이지 |
| `/connect` | 지갑 연결 및 로그인 |
| `/dashboard` | 마이페이지 (잔액, 빠른 메뉴) |
| `/deposit` | 입금 (QR코드, 수동 TX 처리) |
| `/withdraw` | 출금 신청 |
| `/transactions` | 거래 내역 (필터링) |
| `/admin` | 관리자 패널 (회원/입출금 관리) |

## API 엔드포인트

### 인증
- `GET /api/auth/nonce?address=` — nonce 발급
- `POST /api/auth/verify` — 서명 검증 및 로그인
- `GET /api/auth/me` — 현재 세션 조회
- `POST /api/auth/logout` — 로그아웃

### 사용자
- `GET /api/deposit` — 입금 내역
- `POST /api/deposit` — TX 해시로 입금 처리
- `GET /api/withdraw` — 출금 내역
- `POST /api/withdraw` — 출금 신청
- `GET /api/transactions` — 거래 내역

### 관리자 (isAdmin 필요)
- `GET /api/admin/stats` — 통계
- `GET /api/admin/users` — 회원 목록
- `GET /api/admin/deposits` — 전체 입금 내역
- `GET /api/admin/withdrawals` — 전체 출금 내역
- `POST /api/admin/withdrawals` — 출금 승인/거절
- `POST /api/admin/balance` — 잔액 환불/조정

## 보안 설계

- **중복 입금 방지**: `txHash` 유니크 제약
- **중복 출금 방지**: 진행중인 출금 중복 신청 차단
- **출금 제한**: 일일 최대 3회
- **서명 검증**: SIWE 패턴 (nonce 1회 사용)
- **관리자 보호**: 모든 관리자 API에서 `isAdmin` 체크
- **잔액 원자성**: Prisma 트랜잭션으로 잔액 변경

## HD 지갑 구조

```
마스터 니모닉
└── m/44'/60'/0'/0/
    ├── /0  → 유저 #1 전용 입금 주소
    ├── /1  → 유저 #2 전용 입금 주소
    ├── /2  → 유저 #3 전용 입금 주소
    └── ...
```

마스터 지갑 (출금용): `m/44'/60'/0'/0/0`

## 프로덕션 배포

1. `ETH_RPC_URL`을 메인넷으로 변경
2. `NEXT_PUBLIC_NETWORK=ethereum`, `CHAIN_ID=1`
3. etherscan 링크를 메인넷용으로 변경 (`sepolia.` 제거)
4. HTTPS 필수 (Secure 쿠키)
5. 마스터 지갑 자금 충전 확인
