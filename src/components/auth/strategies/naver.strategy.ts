import { Injectable, BadRequestException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-naver';
import { ConfigService } from '@nestjs/config';
import { OAuthService, OAuthProfile } from '../oauth.service';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OAuthService,
  ) {
    const clientID = configService.get<string>('NAVER_CLIENT_ID') || '';
    const clientSecret = configService.get<string>('NAVER_CLIENT_SECRET') || '';
    const callbackURL = configService.get<string>('NAVER_CALLBACK_URL') || 'http://localhost:3000/auth/naver/callback';

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
    profile: Profile,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    const { id, emails, displayName, _json } = profile;
    
    const email = emails?.[0]?.value || `${id}@naver.com`;
    const name = displayName || _json?.nickname || `네이버${id}`;
    const profileImage = _json?.profile_image;

    const oauthProfile: OAuthProfile = {
      provider: 'naver',
      providerId: id,
      email: email,
      name: name,
      profileImage: profileImage,
    };

    try {
      const result = await this.oauthService.validateOAuthLogin(oauthProfile);
      
      // Check if login was successful
      if (!result || !result.accessToken) {
        return done(null, false);
      }
      
      done(null, result);
    } catch (error) {
      // Pass the error to Passport, which will trigger the exception filter
      done(error);
    }
  }
}
