// Single place for all network access.
//
// - Open-Meteo provides the weather forecast AND forward geocoding (city
//   search by name). It is free, needs no API key, and supports CORS.
// - Geoapify is used ONLY for reverse geocoding (coordinates -> place name)
//   because Open-Meteo's geocoding API is forward-only (its `name` parameter is
//   required and there is no lat/lon lookup).

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const GEOAPIFY_URL = "https://api.geoapify.com/v1/geocode/reverse";

const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;
const language = (navigator.language || "en").split("-")[0];

// Variables requested from Open-Meteo, kept in one place for easy review.
const CURRENT_VARIABLES = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "is_day",
  "precipitation",
  "weather_code",
  "wind_speed_10m",
].join(",");

const DAILY_VARIABLES = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_probability_max",
].join(",");

// --- Browser geolocation -----------------------------------------------------
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

// --- Reverse geocoding (Geoapify): coordinates -> city/country name ----------
export async function getCityFromCoords(latitude, longitude) {
  if (!latitude || !longitude) {
    throw new Error("Latitude and longitude are required.");
  }
  if (!GEOAPIFY_API_KEY) {
    throw new Error("Geoapify API key is not defined.");
  }

  const url = `${GEOAPIFY_URL}?lat=${latitude}&lon=${longitude}&apiKey=${GEOAPIFY_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch location info.");

  const data = await res.json();
  const props = data?.features?.[0]?.properties;
  if (!props) throw new Error("No location found for these coordinates.");

  const city = props.city || props.town || props.village || props.county || null;
  const country = props.country || props.country_code || null;

  if (!city || !country) {
    throw new Error("Could not determine city or country from coordinates.");
  }

  return { city, country };
}

// --- Forward geocoding (Open-Meteo): city name -> coordinates ---------------
function normalizePlace(place) {
  return {
    id: place.id,
    name: place.name,
    country: place.country || place.country_code || "",
    admin1: place.admin1 || "",
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone || "",
  };
}

export async function searchCities(query, count = 5) {
  const term = String(query ?? "").trim();
  if (term.length < 2) return [];

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(
    term
  )}&count=${count}&language=${encodeURIComponent(language)}&format=json`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("City lookup failed.");

  const data = await res.json();
  if (data?.error) throw new Error(data.reason || "City lookup failed.");

  const results = Array.isArray(data?.results) ? data.results : [];
  return results.map(normalizePlace);
}

// Resolve a single best-matching place for a search term.
export async function getCity(query) {
  const results = await searchCities(query, 1);
  if (results.length === 0) {
    throw new Error("City not found.");
  }
  return results[0];
}

// --- Forecast (Open-Meteo) ---------------------------------------------------
// Shape the Open-Meteo response once, here, so components work with a small,
// stable model instead of Open-Meteo's parallel arrays.
function normalizeForecast(data) {
  const current = data.current ?? {};
  const daily = data.daily ?? {};
  const times = Array.isArray(daily.time) ? daily.time : [];

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone ?? "",
    units: {
      temperature: data.current_units?.temperature_2m || "°C",
      windSpeed: data.current_units?.wind_speed_10m || "km/h",
      precipitation: data.current_units?.precipitation || "mm",
    },
    current: {
      time: current.time ?? null,
      temperature: current.temperature_2m,
      apparentTemperature: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      weatherCode: current.weather_code,
      windSpeed: current.wind_speed_10m,
      isDay: current.is_day === 1,
    },
    daily: times.map((date, index) => ({
      date,
      weatherCode: daily.weather_code?.[index],
      temperatureMax: daily.temperature_2m_max?.[index],
      temperatureMin: daily.temperature_2m_min?.[index],
      precipitationProbability: daily.precipitation_probability_max?.[index],
    })),
  };
}

export async function getForecast(latitude, longitude, days = 7) {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {
    throw new Error("Latitude and longitude are required.");
  }

  const url =
    `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&current=${CURRENT_VARIABLES}&daily=${DAILY_VARIABLES}` +
    `&timezone=auto&forecast_days=${days}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Network response was not ok.");

  const data = await res.json();
  if (data?.error) throw new Error(data.reason || "Weather request failed.");

  return normalizeForecast(data);
}