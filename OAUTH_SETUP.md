# OAuth SNS Login Setup Guide

This guide explains how to set up Google, Kakao, and Naver OAuth login for the application.

## Installation

First, install the required packages:

```bash
npm install passport-google-oauth20 passport-kakao passport-naver
npm install --save-dev @types/passport-google-oauth20 @types/passport-kakao @types/passport-naver
```

## Environment Variables

Add the following variables to your `.env` file:

```env
# Frontend URL (for OAuth redirects)
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

## OAuth Provider Setup

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URI: `http://localhost:3000/auth/google/callback` (or your production URL)
7. Copy the Client ID and Client Secret to your `.env` file

### 2. Kakao OAuth Setup

1. Go to [Kakao Developers](https://developers.kakao.com/)
2. Create an application
3. Go to "앱 설정" → "플랫폼" → "Web 플랫폼 등록"
4. Add site URL: `http://localhost:3000` (or your production URL)
5. Go to "제품 설정" → "카카오 로그인" → "활성화"
6. Add redirect URI: `http://localhost:3000/auth/kakao/callback`
7. Go to "앱 키" and copy:
   - REST API 키 → `KAKAO_CLIENT_ID`
   - Client Secret → `KAKAO_CLIENT_SECRET`

### 3. Naver OAuth Setup

1. Go to [Naver Developers](https://developers.naver.com/)
2. Create an application
3. Go to "API 설정" → "로그인 오픈 API 서비스 환경"
4. Add service URL: `http://localhost:3000` (or your production URL)
5. Add callback URL: `http://localhost:3000/auth/naver/callback`
6. Copy:
   - Client ID → `NAVER_CLIENT_ID`
   - Client Secret → `NAVER_CLIENT_SECRET`

## API Endpoints

### OAuth Login Initiation

- **Google**: `GET /auth/google`
- **Kakao**: `GET /auth/kakao`
- **Naver**: `GET /auth/naver`

### OAuth Callbacks (Internal)

- **Google**: `GET /auth/google/callback`
- **Kakao**: `GET /auth/kakao/callback`
- **Naver**: `GET /auth/naver/callback`

These callbacks redirect to your frontend with the access token:
```
{FRONTEND_URL}/auth/callback?token={accessToken}&provider={provider}
```

## Frontend Integration

### Example: React

```javascript
// Redirect to OAuth provider
const handleGoogleLogin = () => {
  window.location.href = 'http://localhost:3000/auth/google';
};

const handleKakaoLogin = () => {
  window.location.href = 'http://localhost:3000/auth/kakao';
};

const handleNaverLogin = () => {
  window.location.href = 'http://localhost:3000/auth/naver';
};

// Handle callback
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const provider = urlParams.get('provider');
  
  if (token) {
    // Save token to localStorage or state
    localStorage.setItem('accessToken', token);
    // Redirect to home or dashboard
    window.location.href = '/';
  }
}, []);
```

## How It Works

1. User clicks "Login with Google/Kakao/Naver" button
2. Frontend redirects to `/auth/{provider}`
3. User authenticates with the OAuth provider
4. Provider redirects to `/auth/{provider}/callback`
5. Backend validates the OAuth token and creates/updates user
6. Backend generates JWT token and redirects to frontend
7. Frontend receives token and stores it for authenticated requests

## User Account Linking

- If a user logs in with SNS and an account with the same email already exists, the SNS account will be linked to the existing account
- Users can have multiple SNS providers linked to the same account
- SNS users are automatically approved (no admin approval needed)

## Database Changes

The `Member` entity now includes:
- `provider`: 'google' | 'kakao' | 'naver' | null
- `providerId`: The unique ID from the OAuth provider

## Notes

- SNS users don't have passwords (passwordHash is empty)
- SNS users are automatically set to `GENERAL` member type
- SNS users are automatically approved (`isApproved: true`)
- JWT tokens for SNS login expire in 30 days (longer than regular login)
