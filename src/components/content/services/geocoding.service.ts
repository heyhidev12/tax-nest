import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface NaverGeocodeResponse {
  status: string;
  meta: {
    totalCount: number;
    page: number;
    count: number;
  };
  addresses: Array<{
    roadAddress: string;
    jibunAddress: string;
    englishAddress: string;
    addressElements: Array<{
      types: string[];
      longName: string;
      shortName: string;
      code: string;
    }>;
    x: string; // longitude
    y: string; // latitude
    distance: number;
  }>;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly apiUrl = 'https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode';

  /**
   * Geocode an address using Naver Maps Geocode API
   * @param address The address to geocode
   * @returns Object with latitude and longitude, or null if geocoding fails
   */
  async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
    if (!address || !address.trim()) {
      this.logger.warn('Empty address provided for geocoding');
      return null;
    }

    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      this.logger.error('Naver Maps API credentials not configured (NAVER_CLIENT_ID, NAVER_CLIENT_SECRET)');
      return null;
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `${this.apiUrl}?query=${encodedAddress}`;

      const response = await axios.get<NaverGeocodeResponse>(url, {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': clientId,
          'X-NCP-APIGW-API-KEY': clientSecret,
        },
      });

      if (response.data.status === 'OK' && response.data.addresses && response.data.addresses.length > 0) {
        const firstResult = response.data.addresses[0];
        const latitude = parseFloat(firstResult.y);
        const longitude = parseFloat(firstResult.x);

        if (isNaN(latitude) || isNaN(longitude)) {
          this.logger.warn(`Invalid coordinates returned for address: ${address}`);
          return null;
        }

        this.logger.log(`Successfully geocoded address: ${address} -> (${latitude}, ${longitude})`);
        return { latitude, longitude };
      } else {
        this.logger.warn(`No results found for address: ${address}`);
        return null;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Failed to geocode address "${address}": ${error.response?.status} ${error.response?.statusText}`,
        );
      } else {
        this.logger.error(`Failed to geocode address "${address}": ${error.message}`);
      }
      return null;
    }
  }
}

