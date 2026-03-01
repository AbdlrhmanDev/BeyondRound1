/**
 * Location Service - Handles Country-State-City API operations
 * Uses Next.js API routes (/api/location/countries, etc.) to avoid CORS and keep API key secure
 * Falls back to direct API on localhost for dev
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

const API_KEY = (process.env.NEXT_PUBLIC_COUNTRY_STATE_CITY_API_KEY || "").trim();

/** Use proxy to avoid CORS and keep API key secure */
const useProxy = true;

async function fetchCountries(): Promise<Country[]> {
  if (useProxy) {
    const res = await fetch("/api/location/countries");
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }
  const headers: Record<string, string> = {};
  if (API_KEY) headers["X-CSCAPI-KEY"] = API_KEY;
  const res = await fetch("https://api.countrystatecity.in/v1/countries", { headers });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchStates(countryIso2: string): Promise<State[]> {
  if (!countryIso2?.trim()) return [];
  if (useProxy) {
    const res = await fetch(`/api/location/states?country=${encodeURIComponent(countryIso2)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }
  const headers: Record<string, string> = {};
  if (API_KEY) headers["X-CSCAPI-KEY"] = API_KEY;
  const res = await fetch(`https://api.countrystatecity.in/v1/countries/${countryIso2}/states`, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchCities(countryIso2: string, stateIso2: string): Promise<City[]> {
  if (!countryIso2?.trim() || !stateIso2?.trim()) return [];
  if (useProxy) {
    const res = await fetch(
      `/api/location/cities?country=${encodeURIComponent(countryIso2)}&state=${encodeURIComponent(stateIso2)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }
  const headers: Record<string, string> = {};
  if (API_KEY) headers["X-CSCAPI-KEY"] = API_KEY;
  const res = await fetch(
    `https://api.countrystatecity.in/v1/countries/${countryIso2}/states/${stateIso2}/cities`,
    { headers }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export const getCountries = async (): Promise<Country[]> => {
  try {
    return await fetchCountries();
  } catch {
    return [];
  }
};

export const getStates = async (countryIso2: string): Promise<State[]> => {
  try {
    return await fetchStates(countryIso2);
  } catch {
    return [];
  }
};

export const getCities = async (countryIso2: string, stateIso2: string): Promise<City[]> => {
  try {
    return await fetchCities(countryIso2, stateIso2);
  } catch {
    return [];
  }
};
