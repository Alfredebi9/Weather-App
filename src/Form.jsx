import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setCity,
  setCoordinates,
  setCountry,
  setError,
  setForecast,
} from "./locationSlice";
import { getCity, searchCities } from "./weatherApi";
import { validationError, toUserError } from "./errors";

function Form() {
  const [cityCache, setCityCache] = useState({});
  const [searchCity, setSearchCity] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const dispatch = useDispatch();
  const { city: cityName } = useSelector((state) => state.location);
  const activeRequest = useRef(0);

  // Debounced city suggestions (Open-Meteo forward geocoding).
  useEffect(() => {
    const term = searchCity.trim();
    const requestId = ++activeRequest.current;

    if (term.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoadingSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchCities(term, 5);
        // Ignore stale responses from earlier keystrokes.
        if (requestId !== activeRequest.current) return;

        const unique = [];
        for (const place of results) {
          const key = `${place.name}|${place.admin1}|${place.country}`.toLowerCase();
          const seen = unique.some(
            (item) =>
              `${item.name}|${item.admin1}|${item.country}`.toLowerCase() === key
          );
          if (!seen) unique.push(place);
        }
        setSuggestions(unique.slice(0, 5));
        setShowSuggestions(true);
      } catch {
        // Suggestions are best-effort; stay silent so we don't interrupt typing.
        if (requestId === activeRequest.current) setSuggestions([]);
      } finally {
        if (requestId === activeRequest.current) setLoadingSuggestions(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchCity]);

  function handleInputChange(e) {
    const value = e.target.value;
    setSearchCity(value);
    setActiveSuggestion(0);
    // Clear a previous validation message once the input looks valid again.
    if (value.trim().length >= 2 && /^[a-zA-Z\s, -]+$/.test(value.trim())) {
      dispatch(setError(null));
    }
  }

  // Move the app to a resolved place. The forecast is cleared because it
  // belongs to the previous location, which makes WeatherDisplay show the
  // blocking loader until the new data arrives.
  function applyLocation(place) {
    dispatch(setCity(place.name || ""));
    dispatch(setCountry(place.country || ""));
    dispatch(
      setCoordinates({
        latitude: place.latitude,
        longitude: place.longitude,
      })
    );
    dispatch(setForecast(null));
    dispatch(setError(null));
    setSearchCity("");
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function handleSuggestionClick(suggestion) {
    setSearchCity(suggestion.name);
    setSuggestions([]);
    setShowSuggestions(false);
    applyLocation(suggestion);
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && showSuggestions && suggestions.length > 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[activeSuggestion]);
    }
  }

  async function handleSearch(city) {
    const trimmedCity = city.trim();
    // Keep only letters, spaces, commas, and hyphens.
    const cleanedCity = trimmedCity.replace(/[^a-zA-Z\s,-]/g, "");

    if (!cleanedCity) {
      dispatch(setError(validationError("Please enter a valid city name.")));
      return;
    }
    if (cleanedCity.length < 2) {
      dispatch(
        setError(validationError("City name must be at least 2 characters long."))
      );
      return;
    }
    if (!/^[a-zA-Z\s, -]+$/.test(cleanedCity)) {
      dispatch(
        setError(
          validationError(
            "City name can only contain letters, spaces, commas, and hyphens."
          )
        )
      );
      return;
    }

    const [cityPart, countryPart] = trimmedCity
      .split(",")
      .map((part) => part.trim());
    const cacheKey = `${cityPart}|${countryPart || ""}`.toLowerCase();

    // Nothing changed: keep the current city.
    if (cityPart.toLowerCase() === cityName?.toLowerCase()) {
      setSearchCity("");
      dispatch(setError(null));
      return;
    }

    // Cache resolved places for 30 minutes so repeat searches are instant.
    const cacheTimeout = 30 * 60 * 1000;
    const cachedData = cityCache[cacheKey];
    if (cachedData && Date.now() - cachedData.timestamp < cacheTimeout) {
      applyLocation(cachedData.place);
      return;
    }

    try {
      setSearching(true);
      dispatch(setError(null));

      const query = countryPart ? `${cityPart}, ${countryPart}` : cityPart;
      const place = await getCity(query);
      if (!place) {
        dispatch(
          setError(validationError("City not found. Please try another name."))
        );
        return;
      }

      setCityCache((prevCache) => ({
        ...prevCache,
        [cacheKey]: { place, timestamp: Date.now() },
      }));

      applyLocation(place);
    } catch (error) {
      dispatch(setError(toUserError(error)));
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="relative w-full sm:w-auto">
      <form
        className="flex w-full sm:w-auto items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(searchCity);
        }}
      >
        <div className="relative flex-1">
          <input
            name="searchCity"
            type="search"
            className="flex-1 border-2 border-blue-300 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-purple-200 rounded-md sm:px-3 sm:py-2 py-1.5 px-2 text-base placeholder:text-purple-600 bg-white/90 text-blue-900 transition w-full"
            placeholder="Search city..."
            value={searchCity}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            aria-label="Search city"
            autoComplete="off"
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {showSuggestions && (loadingSuggestions || suggestions.length > 0) && (
            <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {loadingSuggestions && (
                <li className="px-4 py-2 text-gray-500 text-sm">
                  Searching cities...
                </li>
              )}
              {suggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion.id}-${index}`}
                  className={`px-4 py-2 hover:bg-purple-100 cursor-pointer ${
                    index === activeSuggestion ? "bg-purple-100" : ""
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.name}
                  {suggestion.admin1 ? `, ${suggestion.admin1}` : ""}
                  {suggestion.country ? `, ${suggestion.country}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="submit"
          disabled={searching}
          className="bg-stone-600 hover:bg-stone-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold cursor-pointer px-4 sm:py-2 py-2 text-sm sm:text-lg rounded-md shadow transition"
        >
          {searching ? "..." : "Search"}
        </button>
      </form>
    </div>
  );
}

export default Form;