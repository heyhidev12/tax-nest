import { Injectable, BadRequestException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { OAuthService, OAuthProfile } from '../oauth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OAuthService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID') || '';
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET') || '';
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    // Use empty strings if not configured - OAuth will fail gracefully
    super({
      clientID: clientID || 'not-configured',
      clientSecret: clientSecret || 'not-configured',
      callbackURL,
      scope: ['email', 'profile'],
    });
  }
  

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const oauthProfile: OAuthProfile = {
      provider: 'google',
      providerId: id,
      email: emails[0].value,
      name: name.givenName + (name.familyName ? ' ' + name.familyName : ''),
      profileImage: photos?.[0]?.value,
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
