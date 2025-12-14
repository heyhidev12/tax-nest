import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface EasyMailSubscriber {
  id: string | number;
  email: string;
  name?: string;
  subscribed: boolean;
  subscribedAt: string | Date;
  unsubscribedAt?: string | Date | null;
}

export interface EasyMailListResponse {
  subscribers: EasyMailSubscriber[];
  total: number;
  page?: number;
  limit?: number;
}

@Injectable()
export class EasyMailService {
  private readonly logger = new Logger(EasyMailService.name);
  private readonly apiBaseUrl: string;
  private readonly apiKey: string;
  private readonly listId: string;
  private readonly httpClient: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.apiBaseUrl = this.configService.get<string>('EASY_MAIL_API_URL') || 'https://api.easymail.com';
    this.apiKey = this.configService.get<string>('EASY_MAIL_API_KEY') || '';
    this.listId = this.configService.get<string>('EASY_MAIL_LIST_ID') || '';

    this.httpClient = axios.create({
      baseURL: this.apiBaseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (!this.apiKey) {
      this.logger.warn('EASY_MAIL_API_KEY is not configured. Easy Mail integration may not work.');
    }
  }

  /**
   * Get all subscribers from Easy Mail
   */
  async getSubscribers(options: {
    search?: string;
    subscribed?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<EasyMailListResponse> {
    try {
      const { search, subscribed, page = 1, limit = 100 } = options;

      const params: Record<string, any> = {
        page,
        limit,
      };

      if (search) {
        params.search = search;
      }

      if (subscribed !== undefined) {
        params.subscribed = subscribed;
      }

      const response = await this.httpClient.get(`/lists/${this.listId}/subscribers`, {
        params,
      });

      return {
        subscribers: response.data.subscribers || response.data.data || [],
        total: response.data.total || response.data.count || 0,
        page: response.data.page || page,
        limit: response.data.limit || limit,
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch subscribers from Easy Mail: ${error.message}`, error.stack);
      
      // If API is not configured, return empty result instead of throwing
      if (!this.apiKey || error.response?.status === 401) {
        this.logger.warn('Easy Mail API not configured or unauthorized. Returning empty result.');
        return {
          subscribers: [],
          total: 0,
          page: options.page || 1,
          limit: options.limit || 100,
        };
      }

      throw new HttpException(
        `Easy Mail API error: ${error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get a single subscriber by ID
   */
  async getSubscriberById(id: string | number): Promise<EasyMailSubscriber | null> {
    try {
      const response = await this.httpClient.get(`/lists/${this.listId}/subscribers/${id}`);

      return response.data.subscriber || response.data;
    } catch (error: any) {
      this.logger.error(`Failed to fetch subscriber from Easy Mail: ${error.message}`, error.stack);
      
      if (!this.apiKey || error.response?.status === 401) {
        return null;
      }

      if (error.response?.status === 404) {
        return null;
      }

      throw new HttpException(
        `Easy Mail API error: ${error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Toggle subscription status in Easy Mail
   */
  async toggleSubscription(id: string | number, subscribed: boolean): Promise<EasyMailSubscriber> {
    try {
      const response = await this.httpClient.patch(
        `/lists/${this.listId}/subscribers/${id}`,
        { subscribed },
      );

      return response.data.subscriber || response.data;
    } catch (error: any) {
      this.logger.error(`Failed to toggle subscription in Easy Mail: ${error.message}`, error.stack);
      
      throw new HttpException(
        `Easy Mail API error: ${error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Subscribe a new subscriber to Easy Mail
   */
  async subscribeSubscriber(email: string, name?: string): Promise<EasyMailSubscriber> {
    try {
      const response = await this.httpClient.post(
        `/lists/${this.listId}/subscribers`,
        {
          email,
          name: name || '',
          subscribed: true,
        },
      );

      return response.data.subscriber || response.data;
    } catch (error: any) {
      this.logger.error(`Failed to subscribe to Easy Mail: ${error.message}`, error.stack);
      
      // If subscriber already exists, try to update instead
      if (error.response?.status === 409 || error.response?.status === 400) {
        // Try to find and update existing subscriber
        const subscribers = await this.getSubscribers({ search: email, limit: 1 });
        const existing = subscribers.subscribers.find(s => s.email === email);
        if (existing) {
          return await this.toggleSubscription(existing.id, true);
        }
      }

      if (!this.apiKey || error.response?.status === 401) {
        this.logger.warn('Easy Mail API not configured or unauthorized.');
        throw new HttpException(
          'Easy Mail API is not configured',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        `Easy Mail API error: ${error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Unsubscribe a subscriber from Easy Mail
   */
  async unsubscribeSubscriber(email: string): Promise<EasyMailSubscriber | null> {
    try {
      // Find subscriber by email
      const subscribers = await this.getSubscribers({ search: email, limit: 1 });
      const subscriber = subscribers.subscribers.find(s => s.email === email);
      
      if (!subscriber) {
        return null;
      }

      // Toggle subscription to false
      return await this.toggleSubscription(subscriber.id, false);
    } catch (error: any) {
      this.logger.error(`Failed to unsubscribe from Easy Mail: ${error.message}`, error.stack);
      
      if (!this.apiKey || error.response?.status === 401) {
        this.logger.warn('Easy Mail API not configured or unauthorized.');
        return null;
      }

      throw new HttpException(
        `Easy Mail API error: ${error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete subscriber from Easy Mail
   */
  async deleteSubscriber(id: string | number): Promise<void> {
    try {
      await this.httpClient.delete(`/lists/${this.listId}/subscribers/${id}`);
    } catch (error: any) {
      this.logger.error(`Failed to delete subscriber from Easy Mail: ${error.message}`, error.stack);
      
      if (error.response?.status === 404) {
        // Already deleted, consider it success
        return;
      }

      throw new HttpException(
        `Easy Mail API error: ${error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
