'use client';

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { getCountries, getStates, getCities, type Country, type State, type City } from "@/services/locationService";

interface LocationSelectProps {
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  nationality?: string;
  onCountryChange?: (country: string) => void;
  onStateChange?: (state: string) => void;
  onCityChange?: (city: string) => void;
  onNeighborhoodChange?: (neighborhood: string) => void;
  onNationalityChange?: (nationality: string) => void;
  className?: string;
  showNeighborhood?: boolean;
  showNationality?: boolean;
  /** Use "profile" on light/standard pages for clear labels and contrast */
  variant?: "default" | "profile";
}

export const LocationSelect = ({
  country: initialCountry = "",
  state: initialState = "",
  city: initialCity = "",
  neighborhood: initialNeighborhood = "",
  nationality: initialNationality = "",
  onCountryChange,
  onStateChange,
  onCityChange,
  onNeighborhoodChange,
  onNationalityChange,
  className = "",
  showNeighborhood = false,
  showNationality = true,
  variant = "default",
}: LocationSelectProps) => {
  const { t } = useTranslation();
  const isProfile = variant === "profile";
  const labelClass = isProfile
    ? "text-sm font-medium text-foreground"
    : "text-base font-medium text-primary-foreground";
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [selectedState, setSelectedState] = useState(initialState);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [neighborhood, setNeighborhood] = useState(initialNeighborhood);
  const [nationality, setNationality] = useState(initialNationality);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Sync with prop changes
  useEffect(() => {
    setSelectedCountry(initialCountry);
    setSelectedState(initialState);
    setSelectedCity(initialCity);
    setNeighborhood(initialNeighborhood);
    setNationality(initialNationality);
  }, [initialCountry, initialState, initialCity, initialNeighborhood, initialNationality]);

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      const data = await getCountries();
      setCountries(data);
      setLoadingCountries(false);
    };
    fetchCountries();
  }, []);

  // Fetch states if initial country is provided (only on mount or when countries are loaded)
  useEffect(() => {
    if (initialCountry && countries.length > 0 && states.length === 0 && !loadingStates) {
      const fetchStates = async () => {
        setLoadingStates(true);
        const data = await getStates(initialCountry);
        setStates(data);
        setLoadingStates(false);
      };
      fetchStates();
    }
  }, [initialCountry, countries.length]);

  // Fetch cities if initial country and state are provided (only on mount or when states are loaded)
  useEffect(() => {
    if (initialCountry && initialState && states.length > 0 && cities.length === 0 && !loadingCities) {
      const fetchCities = async () => {
        setLoadingCities(true);
        const data = await getCities(initialCountry, initialState);
        setCities(data);
        setLoadingCities(false);
      };
      fetchCities();
    }
  }, [initialCountry, initialState, states.length]);

  // Fetch states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const fetchStates = async () => {
        setLoadingStates(true);
        setStates([]);
        setCities([]);
        setSelectedState("");
        setSelectedCity("");
        onStateChange?.("");
        onCityChange?.("");
        const data = await getStates(selectedCountry);
        setStates(data);
        setLoadingStates(false);
      };
      fetchStates();
    } else {
      setStates([]);
      setCities([]);
      setSelectedState("");
      setSelectedCity("");
    }
  }, [selectedCountry]);

  // Fetch cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const fetchCities = async () => {
        setLoadingCities(true);
        setCities([]);
        setSelectedCity("");
        onCityChange?.("");
        const data = await getCities(selectedCountry, selectedState);
        setCities(data);
        setLoadingCities(false);
      };
      fetchCities();
    } else {
      setCities([]);
      setSelectedCity("");
    }
  }, [selectedCountry, selectedState]);

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    onCountryChange?.(value);
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    onStateChange?.(value);
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    onCityChange?.(value);
  };

  const handleNeighborhoodChange = (value: string) => {
    setNeighborhood(value);
    onNeighborhoodChange?.(value);
  };

  const handleNationalityChange = (value: string) => {
    setNationality(value);
    onNationalityChange?.(value);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className={labelClass}>{t("common.countryRequired")}</Label>
          <SearchableSelect
            value={selectedCountry}
            onValueChange={handleCountryChange}
            options={countries.map((c) => ({ value: c.iso2, label: c.name }))}
            placeholder={loadingCountries ? t("common.loading") : t("common.selectCountry")}
            searchPlaceholder={t("common.searchCountry")}
            emptyMessage={countries.length === 0 && !loadingCountries ? "Could not load countries. Add NEXT_PUBLIC_COUNTRY_STATE_CITY_API_KEY to .env.local or Vercel env vars." : t("common.noResults")}
            disabled={loadingCountries}
            variant={isProfile ? "profile" : "default"}
          />
        </div>

        <div className="space-y-2">
          <Label className={labelClass}>{t("common.stateRequired")}</Label>
          <SearchableSelect
            value={selectedState}
            onValueChange={handleStateChange}
            options={states.map((s) => ({ value: s.iso2, label: s.name }))}
            placeholder={loadingStates ? t("common.loading") : selectedCountry ? t("common.selectState") : t("common.selectCountryFirst")}
            searchPlaceholder={t("common.searchState")}
            emptyMessage={t("common.noResults")}
            disabled={!selectedCountry || loadingStates}
            variant={isProfile ? "profile" : "default"}
          />
        </div>

        <div className="space-y-2">
          <Label className={labelClass}>{t("common.cityRequired")}</Label>
          <SearchableSelect
            value={selectedCity}
            onValueChange={handleCityChange}
            options={cities.map((c, i) => ({ value: c.name, label: c.name }))}
            placeholder={loadingCities ? t("common.loading") : selectedState ? t("common.selectCity") : t("common.selectStateFirst")}
            searchPlaceholder={t("common.searchCity")}
            emptyMessage={t("common.noResults")}
            disabled={!selectedState || loadingCities}
            variant={isProfile ? "profile" : "default"}
          />
        </div>
      </div>


      {showNationality && (
        <div className="space-y-2">
          <Label className={labelClass}>{t("common.nationalityRequired")}</Label>
          <SearchableSelect
            value={nationality}
            onValueChange={handleNationalityChange}
            options={countries.map((c) => ({ value: c.name, label: c.name }))}
            placeholder={t("common.selectNationality")}
            searchPlaceholder={t("common.searchNationality")}
            emptyMessage={t("common.noResults")}
            variant={isProfile ? "profile" : "default"}
          />
        </div>
      )}
    </div>
  );
};
