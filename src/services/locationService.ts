/**
 * Location Service - Handles Country-State-City API operations
 * Following Single Responsibility Principle
 */

export interface Country {
  iso2: string;
  name: string;
}

export interface State {
  iso2: string;
  name: string;
}

export interface City {
  name: string;
}

// API Key for CountryStateCity API - Get your free API key from https://countrystatecity.in/
// Add it to your .env file as VITE_COUNTRY_STATE_CITY_API_KEY (no spaces around =)
const API_KEY = (import.meta.env.VITE_COUNTRY_STATE_CITY_API_KEY || '').trim();

/**
 * Fetches all countries
 */
export const getCountries = async (): Promise<Country[]> => {
  try {
    const headers: Record<string, string> = {};
    if (API_KEY) {
      headers['X-CSCAPI-KEY'] = API_KEY;
    }

    const response = await fetch('https://api.countrystatecity.in/v1/countries', {
      headers
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error("API key required. Get a free API key from https://countrystatecity.in/");
      } else {
        console.error("Error fetching countries:", response.statusText);
      }
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching countries:", error);
    return [];
  }
};

/**
 * Fetches states for a given country
 */
export const getStates = async (countryIso2: string): Promise<State[]> => {
  try {
    if (!countryIso2?.trim()) {
      return [];
    }

    const headers: Record<string, string> = {};
    if (API_KEY) {
      headers['X-CSCAPI-KEY'] = API_KEY;
    }

    const response = await fetch(`https://api.countrystatecity.in/v1/countries/${countryIso2}/states`, {
      headers
    });

    if (!response.ok) {
      console.error("Error fetching states:", response.statusText);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching states:", error);
    return [];
  }
};

/**
 * Fetches cities for a given country and state
 */
export const getCities = async (countryIso2: string, stateIso2: string): Promise<City[]> => {
  try {
    if (!countryIso2?.trim() || !stateIso2?.trim()) {
      return [];
    }

    const headers: Record<string, string> = {};
    if (API_KEY) {
      headers['X-CSCAPI-KEY'] = API_KEY;
    }

    const response = await fetch(`https://api.countrystatecity.in/v1/countries/${countryIso2}/states/${stateIso2}/cities`, {
      headers
    });

    if (!response.ok) {
      console.error("Error fetching cities:", response.statusText);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching cities:", error);
    return [];
  }
};
