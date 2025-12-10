import { Injectable, BadRequestException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';
import { OAuthService, OAuthProfile } from '../oauth.service';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OAuthService,
  ) {
    const clientID = configService.get<string>('KAKAO_CLIENT_ID') || '';
    const clientSecret = configService.get<string>('KAKAO_CLIENT_SECRET') || '';
    const callbackURL = configService.get<string>('KAKAO_CALLBACK_URL') || 'http://localhost:3000/auth/kakao/callback';

    // Use empty strings if not configured - OAuth will fail gracefully
    super({
      clientID: clientID || 'not-configured',
      clientSecret: clientSecret || 'not-configured',
      callbackURL,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    const { id, username, _json } = profile;
    
    // Kakao profile structure
    const kakaoAccount = _json.kakao_account || {};
    const email = kakaoAccount.email || `${id}@kakao.com`;
    const nickname = kakaoAccount.profile?.nickname || username || `카카오${id}`;
    const profileImage = kakaoAccount.profile?.profile_image_url;

    const oauthProfile: OAuthProfile = {
      provider: 'kakao',
      providerId: id.toString(),
      email: email,
      name: nickname,
      profileImage: profileImage,
    };

    try {
      const result = await this.oauthService.validateOAuthLogin(oauthProfile);
      done(null, result);
    } catch (error) {
      done(error, null);
    }
  }
}
