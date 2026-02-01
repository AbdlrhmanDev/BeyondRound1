import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
    : "text-base font-medium text-primary-foreground/70";
  const triggerClass = isProfile
    ? "h-12 rounded-xl bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-ring"
    : "h-14 bg-background/10 border-primary-foreground/20 text-foreground rounded-2xl";
  const triggerBorderClass = isProfile
    ? "border-input"
    : "border-primary-foreground/20";
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
          <Select value={selectedCountry} onValueChange={handleCountryChange} disabled={loadingCountries}>
            <SelectTrigger className={`${triggerClass} ${triggerBorderClass} ${
              !selectedCountry && !isProfile ? "border-primary/50" : ""
            } ${!selectedCountry && isProfile ? "text-muted-foreground" : ""}`}>
              <SelectValue placeholder={loadingCountries ? t("common.loading") : t("common.selectCountry")} />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.iso2} value={country.iso2}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={labelClass}>State *</Label>
          <Select 
            value={selectedState} 
            onValueChange={handleStateChange} 
            disabled={!selectedCountry || loadingStates}
          >
            <SelectTrigger className={`${triggerClass} ${triggerBorderClass} ${
              !selectedState && !isProfile ? "border-primary/50" : ""
            } ${!selectedState && isProfile ? "text-muted-foreground" : ""}`}>
              <SelectValue placeholder={loadingStates ? t("common.loading") : selectedCountry ? t("common.selectState") : t("common.selectCountryFirst")} />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state.iso2} value={state.iso2}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={labelClass}>{t("common.cityRequired")}</Label>
          <Select 
            value={selectedCity} 
            onValueChange={handleCityChange} 
            disabled={!selectedState || loadingCities}
          >
            <SelectTrigger className={`${triggerClass} ${triggerBorderClass} ${
              !selectedCity && !isProfile ? "border-primary/50" : ""
            } ${!selectedCity && isProfile ? "text-muted-foreground" : ""}`}>
              <SelectValue placeholder={loadingCities ? t("common.loading") : selectedState ? t("common.selectCity") : t("common.selectStateFirst")} />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city, index) => (
                <SelectItem key={`${city.name}-${index}`} value={city.name}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>


      {showNationality && (
        <div className="space-y-2">
          <Label className={labelClass}>Nationality *</Label>
          <Select 
            value={nationality} 
            onValueChange={handleNationalityChange}
          >
            <SelectTrigger className={`${triggerClass} ${triggerBorderClass} ${
              !nationality && !isProfile ? "border-primary/50" : ""
            } ${!nationality && isProfile ? "text-muted-foreground" : ""}`}>
              <SelectValue placeholder="Select Nationality" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={`nationality-${country.iso2}`} value={country.name}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
