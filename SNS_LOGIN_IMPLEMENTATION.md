# SNS Login Implementation Summary

## ✅ Completed Implementation

### 1. Database Changes
- ✅ Updated `Member` entity with `provider` and `providerId` fields
- ✅ Made `passwordHash` nullable for SNS users

### 2. Services Created
- ✅ `OAuthService` - Handles SNS login logic, user creation/linking
- ✅ `GoogleStrategy` - Google OAuth2 strategy
- ✅ `KakaoStrategy` - Kakao OAuth strategy  
- ✅ `NaverStrategy` - Naver OAuth strategy

### 3. Controller Updates
- ✅ Added OAuth routes to `AuthController`:
  - `GET /auth/google` - Initiate Google login
  - `GET /auth/google/callback` - Google callback
  - `GET /auth/kakao` - Initiate Kakao login
  - `GET /auth/kakao/callback` - Kakao callback
  - `GET /auth/naver` - Initiate Naver login
  - `GET /auth/naver/callback` - Naver callback

### 4. Module Updates
- ✅ Updated `AuthModule` with OAuth strategies and service

### 5. Package Dependencies
- ✅ Updated `package.json` with required OAuth packages

## 📦 Installation Required

Run the following command to install OAuth packages:

```bash
npm install passport-google-oauth20 passport-kakao passport-naver
npm install --save-dev @types/passport-google-oauth20 @types/passport-kakao @types/passport-naver
```

## 🔧 Environment Variables Required

Add these to your `.env` file:

```env
# Frontend URL for OAuth redirects
FRONTEND_URL=http://localhost:3001

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Kakao OAuth
KAKAO_CLIENT_ID=your-kakao-rest-api-key
KAKAO_CLIENT_SECRET=your-kakao-client-secret
KAKAO_CALLBACK_URL=http://localhost:3000/auth/kakao/callback

# Naver OAuth
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
NAVER_CALLBACK_URL=http://localhost:3000/auth/naver/callback
```

## 📝 Files Created/Modified

### Created Files:
1. `src/components/auth/oauth.service.ts` - OAuth service
2. `src/components/auth/strategies/google.strategy.ts` - Google strategy
3. `src/components/auth/strategies/kakao.strategy.ts` - Kakao strategy
4. `src/components/auth/strategies/naver.strategy.ts` - Naver strategy
5. `OAUTH_SETUP.md` - Detailed setup guide

### Modified Files:
1. `src/libs/entity/member.entity.ts` - Added provider fields, nullable passwordHash
2. `src/components/auth/auth.controller.ts` - Added OAuth routes
3. `src/components/auth/auth.module.ts` - Added OAuth providers
4. `src/components/auth/auth.service.ts` - Added SNS user check in login
5. `package.json` - Added OAuth dependencies

## 🚀 How to Use

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up OAuth Apps
Follow the detailed guide in `OAUTH_SETUP.md` to:
- Create Google OAuth app
- Create Kakao OAuth app
- Create Naver OAuth app

### 3. Configure Environment
Add OAuth credentials to `.env` file

### 4. Run Migration (if needed)
The entity changes will be auto-synced if `synchronize: true` is set in TypeORM config.

### 5. Test OAuth Login
- Navigate to `http://localhost:3000/auth/google` in browser
- Or use frontend buttons that redirect to these endpoints

## 🔄 OAuth Flow

1. User clicks "Login with Google/Kakao/Naver"
2. Frontend redirects to `/auth/{provider}`
3. User authenticates with OAuth provider
4. Provider redirects to `/auth/{provider}/callback`
5. Backend validates OAuth token
6. Backend creates/updates user account
7. Backend generates JWT token
8. Backend redirects to frontend: `{FRONTEND_URL}/auth/callback?token={token}&provider={provider}`
9. Frontend stores token and logs user in

## ✨ Features

- ✅ Automatic user creation for new SNS users
- ✅ Account linking (if email matches existing account)
- ✅ Auto-approval for SNS users
- ✅ JWT token generation (30-day expiration)
- ✅ Support for Google, Kakao, and Naver
- ✅ Profile image support (stored in profile, can be added to entity if needed)

## 📌 Notes

- SNS users don't have passwords (`passwordHash` is null)
- SNS users are automatically set to `GENERAL` member type
- SNS users are automatically approved
- If an account with the same email exists, SNS account is linked to it
- Multiple SNS providers can be linked to the same account
