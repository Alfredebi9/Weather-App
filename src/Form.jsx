import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCity, setCountry, setError, setLoading } from "./locationSlice";
import { getCity, getWeather } from "./geolocation";

function Form() {
  const [cityCache, setCityCache] = useState({});
  const [searchCity, setSearchCity] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const dispatch = useDispatch();
  const { city: cityName } = useSelector((state) => state.location);

  // Debounce search for suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchCity.trim().length >= 2) {
        try {
          const data = await getWeather(searchCity, true); // <--- pass true here
          if (data && Array.isArray(data)) {
            const uniqueCities = data.reduce((acc, current) => {
              const cityKey =
                `${current.LocalizedName}, ${current.Country.LocalizedName}`.toLowerCase();
              if (
                !acc.some(
                  (item) =>
                    `${item.LocalizedName}, ${item.Country.LocalizedName}`.toLowerCase() ===
                    cityKey
                )
              ) {
                acc.push(current);
              }
              return acc;
            }, []);
            setSuggestions(uniqueCities.slice(0, 5));
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200); // 200ms debounce delay

    return () => clearTimeout(timer);
  }, [searchCity]);
  function handleInputChange(e) {
    const value = e.target.value;
    setSearchCity(value);
    // Clear error if input is valid
    if (value.trim().length >= 3 && /^[a-zA-Z\s]+$/.test(value.trim())) {
      dispatch(setError(null));
    }
  }

  function handleSuggestionClick(suggestion) {
    const cityName = suggestion.LocalizedName;
    const countryName = suggestion.Country.LocalizedName;

    setSearchCity(`${cityName}, ${countryName}`);
    setSuggestions([]);
    setShowSuggestions(false);
    handleSearch(cityName);
  }

  function handleKeyDown(e) {
    // Arrow down
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    }
    // Arrow up
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : 0));
    }
    // Enter
    else if (e.key === "Enter" && showSuggestions && suggestions.length > 0) {
      e.preventDefault();
      const selected = suggestions[activeSuggestion];
      handleSuggestionClick(selected);
    }
  }

  async function handleSearch(city) {
    const trimmedCity = city.trim();
    // Remove any special characters except letters, spaces, commas, and hyphens
    const cleanedCity = trimmedCity.replace(/[^a-zA-Z\s,-]/g, "");

    // Input validation
    if (!cleanedCity) {
      dispatch(setError("Please enter a valid city name."));
      return;
    }
    if (cleanedCity.length < 2) {
      dispatch(setError("City name must be at least 2 characters long."));
      return;
    }
    if (!/^[a-zA-Z\s, -]+$/.test(cleanedCity)) {
      dispatch(
        setError(
          "City name can only contain letters, spaces, commas, and hyphens."
        )
      );
      return;
    }

    // Extract city name if format is "City, Country"
    const [cityPart] = trimmedCity.split(",").map((part) => part.trim());
    const cacheKey = cityPart.toLowerCase();
    const cachedData = cityCache[cacheKey];

    // Check if input city matches current state
    if (cityPart.toLowerCase() === cityName?.toLowerCase()) {
      setSearchCity("");
      return;
    }

    // cache timeout for 30 minutes
    const cacheTimeout = 30 * 60 * 1000;

    if (cachedData && Date.now() - cachedData.timestamp < cacheTimeout) {
      dispatch(setLoading(true));
      dispatch(setCity(cachedData.cityInfo.name));
      dispatch(setCountry(cachedData.cityInfo.country));
      setSearchCity("");
      setSuggestions([]);
      setShowSuggestions(false);
      dispatch(setLoading(false));
      return;
    }

    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const cityInfo = await getCity(cityPart);

      if (!cityInfo) {
        dispatch(setError("City not found. Please try another name."));
        dispatch(setLoading(false));
        return;
      }

      // Update cache with new data
      setCityCache((prevCache) => ({
        ...prevCache,
        [cacheKey]: {
          cityInfo,
          timestamp: Date.now(),
        },
      }));

      // Update state
      dispatch(setCity(cityInfo.name));
      dispatch(setCountry(cityInfo.country));
      setSearchCity("");
      setSuggestions([]);
      setShowSuggestions(false);
    } catch (error) {
      console.error("Error fetching forecast:", error);
      dispatch(setError("Could not fetch forecast for the specified city."));
    } finally {
      dispatch(setLoading(false));
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
            className="flex-1 border-2 border-blue-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 rounded-md sm:px-3 sm:py-2 py-1.5 px-2 text-base placeholder:text-blue-200 bg-white/90 text-blue-900 transition w-full"
            placeholder="Search city weather..."
            value={searchCity}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            aria-label="Search city"
            autoComplete="off"
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {suggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion.Key}-${index}`}
                  className={`px-4 py-2 hover:bg-purple-100 cursor-pointer ${
                    index === activeSuggestion ? "bg-purple-100" : ""
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.LocalizedName}, {suggestion.Country.LocalizedName}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold cursor-pointer px-4 sm:py-2 py-2 text-sm sm:text-lg rounded-md shadow transition"
        >
          Search
        </button>
      </form>
    </div>
  );
}

export default Form;
