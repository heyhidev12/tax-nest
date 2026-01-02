import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface KakaoAddressResponse {
  documents: Array<{
    address_name: string;
    y: string; // latitude
    x: string; // longitude
    address_type: string;
    address?: {
      address_name: string;
      region_1depth_name: string;
      region_2depth_name: string;
      region_3depth_name: string;
      mountain_yn: string;
      main_address_no: string;
      sub_address_no: string;
      zip_code: string;
    };
    road_address?: {
      address_name: string;
      region_1depth_name: string;
      region_2depth_name: string;
      region_3depth_name: string;
      road_name: string;
      underground_yn: string;
      main_building_no: string;
      sub_building_no: string;
      building_name: string;
      zone_no: string;
    };
  }>;
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly apiUrl = 'https://dapi.kakao.com/v2/local/search/address.json';

  /**
   * Geocode an address using Kakao Local API
   * @param address The address to geocode
   * @returns Object with latitude and longitude, or null if geocoding fails
   */
  async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
    if (!address || !address.trim()) {
      this.logger.warn('Empty address provided for geocoding');
      return null;
    }

    const kakaoApiKey = process.env.KAKAO_CLIENT_ID;

    if (!kakaoApiKey) {
      this.logger.error('Kakao API key not configured (KAKAO_CLIENT_ID)');
      return null;
    }

    try {
      const response = await axios.get<KakaoAddressResponse>(this.apiUrl, {
        params: { query: address },
        headers: {
          Authorization: `KakaoAK ${kakaoApiKey}`,
        },
      });

      if (response.data.documents && response.data.documents.length > 0) {
        const firstResult = response.data.documents[0];
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
          `Failed to geocode address "${address}" using Kakao: ${error.response?.status} ${error.response?.statusText}`,
        );
      } else {
        this.logger.error(`Failed to geocode address "${address}" using Kakao: ${error.message}`);
      }
      return null;
    }
  }
}
