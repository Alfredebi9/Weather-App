const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;
const lang = navigator.language || "en-US";

// Get user location (lat/lon)
export async function getUserLocation() {
  if (!navigator.geolocation) {
    throw new Error("Geolocation is not supported by this browser.");
  }

  const getPosition = () =>
    new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 10000,
      })
    );

  try {
    const position = await getPosition();
    const { latitude, longitude } = position.coords;
    return { latitude, longitude };
  } catch (error) {
    throw new Error("Geolocation error: " + error.message);
  }
}

// Get city and country from coordinates using Geoapify
export async function getCityFromCoords(latitude, longitude) {
  if (!latitude || !longitude) {
    throw new Error("Latitude and longitude are required.");
  }

  if (!GEOAPIFY_API_KEY) {
    throw new Error("Geoapify API key is not defined.");
  }

  try {
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${GEOAPIFY_API_KEY}`
    );

    if (!response.ok) throw new Error("Failed to fetch location info.");

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      throw new Error("No location features found for coordinates.");
    }

    const props = data.features[0].properties;
    const city =
      props.city || props.town || props.village || props.county || null;
    const country = props.country || props.country_code || null;

    if (!city || !country)
      throw new Error("Could not determine city or country from coordinates.");

    return { city, country };
  } catch (error) {
    throw new Error("Geoapify error: " + error.message);
  }
}

// Get city info by city name using AccuWeather
export async function getWeather(city, returnAll = false) {
  if (!WEATHER_API_KEY) {
    throw new Error("Weather API key is not defined.");
  }
  if (!city || city.trim() === "") {
    throw new Error("City name is required.");
  }
  try {
    const res = await fetch(
      `/api/locations/v1/cities/search?apikey=${WEATHER_API_KEY}&q=${city}&language=${lang}`
    );
    if (!res.ok) throw new Error("Network response was not ok.");
    const data = await res.json();
    if (!data || data.length === 0) {
      throw new Error("City not found.");
    }
    return returnAll ? data : data[0];
  } catch (error) {
    throw new Error(
      "Error fetching weather data: " + city + " " + error.message
    );
  }
}

// Fallback: Get city info by coordinates using AccuWeather
export async function getWeatherByCoords(latitude, longitude) {
  if (!WEATHER_API_KEY) {
    throw new Error("Weather API key is not defined.");
  }
  if (!latitude || !longitude) {
    throw new Error("Latitude and longitude are required.");
  }
  try {
    const res = await fetch(
      `/api/locations/v1/cities/geoposition/search?apikey=${WEATHER_API_KEY}&q=${latitude},${longitude}&language=${lang}`
    );
    if (!res.ok) throw new Error("Network response was not ok.");
    const data = await res.json();
    if (!data || !data.Key) {
      throw new Error("City not found by coordinates.");
    }
    return data;
  } catch (error) {
    throw new Error("Error fetching city by coordinates: " + error.message);
  }
}

// Get detailed city info (name, country, lat/lon, etc.) with fallback
export async function getCity(city, latitude, longitude) {
  let locationData = null;
  let errorMsg = "";
  try {
    if (city) {
      locationData = await getWeather(city);
      if (!locationData) {
        throw new Error(
          city
            ? `Could not find city "${city}" or fallback coordinates.`
            : "Unable to find city by coordinates."
        );
      }
    }

    // Fallback to coordinates if city search fails and coords are provided
    if (!locationData && latitude && longitude) {
      locationData = await getWeatherByCoords(latitude, longitude);
      if (!locationData) {
        errorMsg = "Could not find a city for your coordinates.";
      }
    }

    if (!locationData) {
      throw new Error(errorMsg || "Unable to find city information.");
    }

    return {
      countryId: locationData.Country.ID,
      name: locationData.LocalizedName,
      country: locationData.Country.LocalizedName,
      administrativeArea: locationData.AdministrativeArea.LocalizedName,
      lat: locationData.GeoPosition.Latitude,
      lon: locationData.GeoPosition.Longitude,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get 5-day forecast by city name or coordinates
export async function getForecastByKey(city, latitude, longitude) {
  if (!WEATHER_API_KEY) {
    throw new Error("Weather API key is not defined.");
  }
  try {
    let locationData = null;
    if (city) {
      locationData = await getWeather(city);
    }
    // Fallback to coordinates if city search fails and coords are provided
    if ((!locationData || !locationData.Key) && latitude && longitude) {
      locationData = await getWeatherByCoords(latitude, longitude);
    }
    const locationKey = locationData?.Key;
    if (!locationKey) {
      throw new Error("Location key not found for forecast.");
    }
    const res = await fetch(
      `/api/forecasts/v1/daily/5day/${locationKey}?apikey=${WEATHER_API_KEY}&language=${lang}`
    );
    if (!res.ok) throw new Error("Network response was not ok.");
    const data = await res.json();
    return data;
  } catch (error) {
    throw new Error("Error fetching forecast data: " + error.message);
  }
}
