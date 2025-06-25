import { useState } from "react";
import { getCity, getForecastByKey } from "./geolocation";
import { useDispatch, useSelector } from "react-redux";
import { setCity, setCountry, setError, setLoading } from "./locationSlice";

function Header() {
  const [searchCity, setSearchCity] = useState("");
  const dispatch = useDispatch();
  const {
    city: cityName,
    country: countryName,
    error,
  } = useSelector((state) => state.location);

  // Cache object to store city data with timestamps
  const [cityCache, setCityCache] = useState({});

  async function handleSearch(city) {
    const trimmedCity = city.trim();
    if (!trimmedCity) {
      dispatch(setError("Please enter a city name."));
      return;
    }
    if (trimmedCity.length < 3) {
      dispatch(setError("City name must be at least 3 characters long."));
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(trimmedCity)) {
      dispatch(setError("City name can only contain letters and spaces."));
      return;
    }

    const cacheKey = trimmedCity.toLowerCase();
    const cachedData = cityCache[cacheKey];
    const expectedCountry = cachedData?.cityInfo?.country;

    // Check if input city and country match current state, regardless of cache ---
    if (trimmedCity.toLowerCase() === cityName?.toLowerCase()) {
      if (countryName?.toLowerCase() === expectedCountry?.toLowerCase()) {
        setSearchCity("");
        alert("You are already viewing the weather for this city.");
        return;
      }
      setSearchCity("");
      alert("You are already viewing the weather for this city.");
      return;
    }

    // cache timeout for 30 minutes
    const cacheTimeout = 30 * 60 * 1000;

    if (cachedData && Date.now() - cachedData.timestamp < cacheTimeout) {
      dispatch(setLoading(true));
      dispatch(setCity(cachedData.cityInfo.name));
      dispatch(setCountry(cachedData.cityInfo.country));
      setSearchCity("");
      dispatch(setLoading(false));
      return;
    }

    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const cityInfo = await getCity(trimmedCity);

      if (!cityInfo) {
        dispatch(setError("City not found. Please try another name."));
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
      console.log("City Forecast info:", await getForecastByKey(cityInfo.name));

      // return await getForecastByKey(cityInfo.name);
    } catch (error) {
      console.error("Error fetching forecast:", error);
      dispatch(setError("Could not fetch forecast for the specified city."));
    } finally {
      dispatch(setLoading(false));
    }
  }

  function handleInputChange(e) {
    setSearchCity(e.target.value);
  }

  const isValidationError =
    error &&
    (error.includes("enter a city") ||
      error.includes("at least 3 characters") ||
      error.includes("only contain letters"));

  return (
    <header className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-6 shadow-md">
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-lg mb-2 sm:mb-0">
          <span role="img" aria-label="weather">
            ⛅
          </span>{" "}
          Weatherly
        </h1>
        <form
          className="flex w-full sm:w-auto items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(searchCity);
          }}
        >
          <input
            name="searchCity"
            type="search"
            className="flex-1 border-2 border-blue-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 rounded-md sm:px-3 sm:py-2 py-1.5 px-2 text-base placeholder:text-blue-200 bg-white/90 text-blue-900 transition w-3/4 sm:max-w-full"
            placeholder="Search city weather..."
            value={searchCity}
            onChange={handleInputChange}
            aria-label="Search city"
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(searchCity);
              }
            }}
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold  cursor-pointer px-4 sm:py-2 py-2 text-sm sm:text-lg rounded-md shadow transition"
          >
            Search
          </button>
        </form>
      </div>{" "}
      {isValidationError && (
        <div className="max-w-2xl mx-auto mt-2 text-center">
          <span className="text-red-600 bg-red-100 px-3 py-1 rounded">
            {error}
          </span>
        </div>
      )}
    </header>
  );
}

export default Header;
