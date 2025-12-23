import { Injectable } from '@nestjs/common';

export interface MailProvider {
  /**
   * Subscribe an email address to the newsletter.
   * DB is the source of truth; provider should mirror state as best as it can.
   */
  subscribe(email: string, name?: string): Promise<void>;

  /**
   * Unsubscribe an email address from the newsletter.
   * DB is the source of truth; provider should mirror state as best as it can.
   */
  unsubscribe(email: string): Promise<void>;

  /**
   * Send a single newsletter email.
   */
  sendNewsletter(payload: {
    email: string;
    subject: string;
    html: string;
  }): Promise<void>;
}

export const MAIL_PROVIDER_TOKEN = 'MAIL_PROVIDER';

