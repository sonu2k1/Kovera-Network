/**
 * @file backend/src/services/geocoder.ts
 * @description Handles geocoding with a caching layer in PostgreSQL.
 */

import axios from 'axios';
import pool from '../db/pool.js';

interface GeocodeResult {
  lat: number;
  lng: number;
}

const CACHE_TTL_DAYS = parseInt(process.env.GEOCODE_CACHE_TTL_DAYS || '7', 10);
const GOOGLE_API_KEY = process.env.GOOGLE_GEOCODING_API_KEY;

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address) return null;

  const normalizedAddress = address.trim().toLowerCase();

  // 1. Check Cache
  try {
    const cacheRes = await pool.query(
      'SELECT lat, lng, cached_at FROM network_geocode_cache WHERE address = $1',
      [normalizedAddress]
    );

    if (cacheRes.rows.length > 0) {
      const cached = cacheRes.rows[0];
      const cacheDate = new Date(cached.cached_at);
      const isExpired = (Date.now() - cacheDate.getTime()) > CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

      if (!isExpired) {
        return {
          lat: parseFloat(cached.lat),
          lng: parseFloat(cached.lng)
        };
      }
    }
  } catch (err) {
    console.error('Error checking geocode cache:', err);
  }

  // 2. Call Google Geocoding API
  if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'your_google_key_here') {
    // Demo Mode: Return static SF centered random coordinates
    return {
      lat: 37.7749 + (Math.random() - 0.5) * 0.1,
      lng: -122.4194 + (Math.random() - 0.5) * 0.1
    };
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: normalizedAddress,
        key: GOOGLE_API_KEY
      }
    });

    const data = response.data;
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const result = { lat: location.lat, lng: location.lng };

      // 3. Update Cache
      await pool.query(
        `INSERT INTO network_geocode_cache (address, lat, lng, cached_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (address) DO UPDATE 
         SET lat = EXCLUDED.lat, lng = EXCLUDED.lng, cached_at = NOW()`,
        [normalizedAddress, result.lat, result.lng]
      );

      return result;
    } else {
      console.error(`Geocoding failed for "${address}": ${data.status}`);
      return null;
    }
  } catch (err) {
    console.error(`Error calling Google Geocoding API for "${address}":`, err);
    return null;
  }
}
