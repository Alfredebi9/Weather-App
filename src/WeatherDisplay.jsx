import { useSelector, useDispatch } from "react-redux";
import { useEffect, useRef } from "react";
import { useLoaderData } from "react-router-dom";
import {
  getCityFromCoords,
  getForecastByKey,
  getUserLocation,
  getWeather,
  getWeatherByCoords,
} from "./geolocation";
import {
  setCity,
  setCountry,
  setError,
  setForecast,
  setLoading,
} from "./locationSlice";

function WeatherDisplay() {
  const {
    city: cityName,
    country: countryName,
    forecast,
    error,
  } = useSelector((state) => state.location);
  const dispatch = useDispatch();
  const loaderData = useLoaderData();
  const intervalRef = useRef();

  useEffect(() => {
    const fetchForecast = async () => {
      if (!cityName) return;
      try {
        dispatch(setError(null));
        dispatch(setLoading(true));
        const newForecast = await getForecastByKey(
          cityName,
          loaderData?.latitude,
          loaderData?.longitude
        );
        if (newForecast) {
          dispatch(setForecast(newForecast));
        }
      } catch (error) {
        dispatch(
          setError("Could not fetch weather data for this city.", error)
        );
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchForecast();
    // Interval to refresh every 3 hour
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchForecast, 10800000);

    // Cleanup on unmount or city change
    return () => clearInterval(intervalRef.current);
  }, [cityName, loaderData?.latitude, loaderData?.longitude, dispatch]);

  // handle missing forecast
  if (!forecast?.DailyForecasts?.length) {
    return (
      <main className="flex flex-col items-center py-6 sm:py-9 gap-6 justify-center bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <h1 className="capitalize font-bold text-3xl text-center mb-3">
          Weather Unavailable
        </h1>
        <p>Sorry, we couldn't fetch the weather data for your location.</p>
      </main>
    );
  }

  function fahrenheitToCelsius(fahrenheit) {
    const tempCelsius = ((fahrenheit - 32) * 5) / 9;
    const roundTemp = Math.round(tempCelsius);
    return roundTemp;
  }

  const todayDateStr = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
  const todayForecast =
    forecast.DailyForecasts.find((day) => day.Date.startsWith(todayDateStr)) ||
    forecast.DailyForecasts[0]; // fallback to first if not found

  const headline = forecast.Headline;

  // Extract weather data
  const minTemp = todayForecast?.Temperature?.Minimum?.Value;
  const maxTemp = todayForecast?.Temperature?.Maximum?.Value;
  const minTempCelsuis = fahrenheitToCelsius(minTemp);
  const maxTempCelsuis = fahrenheitToCelsius(maxTemp);
  const tempUnit = todayForecast?.Temperature?.Minimum?.Unit;
  const dayPhrase = todayForecast?.Day?.IconPhrase;
  const nightPhrase = todayForecast?.Night?.IconPhrase;
  const dayIcon = todayForecast?.Day?.Icon;
  const nightIcon = todayForecast?.Night?.Icon;
  const dayPrecip = todayForecast?.Day?.HasPrecipitation;
  const nightPrecip = todayForecast?.Night?.HasPrecipitation;
  const dayPrecipType = todayForecast?.Day?.PrecipitationType;
  const nightPrecipType = todayForecast?.Night?.PrecipitationType;
  const dayPrecipIntensity = todayForecast?.Day?.PrecipitationIntensity;
  const nightPrecipIntensity = todayForecast?.Night?.PrecipitationIntensity;
  const headlineText = headline?.Text || "";
  const date = new Date(todayForecast.Date).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Helper to get AccuWeather icon URL
  const getIconUrl = (iconNum) =>
    `https://developer.accuweather.com/sites/default/files/${iconNum
      .toString()
      .padStart(2, "0")}-s.png`;

  const handleTryAgain = async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      // Get user location
      const { latitude, longitude } = await getUserLocation();
      // Get city and country from coordinates
      const cityObject = await getCityFromCoords(latitude, longitude);
      if (!cityObject) throw new Error("Could not get city from coordinates.");
      const { city, country } = cityObject;
      // Get weather info
      let cityDetails = await getWeather(city);
      if (!cityDetails) {
        cityDetails = await getWeatherByCoords(latitude, longitude);
      }
      if (!cityDetails)
        throw new Error(
          "Unable to find weather information for your location."
        );
      dispatch(setCity(cityDetails.LocalizedName || city));
      dispatch(setCountry(cityDetails.Country?.LocalizedName || country));
      // Get forecast
      const forecast = await getForecastByKey(
        cityDetails.LocalizedName || city,
        latitude,
        longitude
      );
      dispatch(setForecast(forecast));
    } catch (error) {
      dispatch(setError(error.message || "Could not refresh weather data."));
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (
    error &&
    !error.includes("enter a city") &&
    !error.includes("at least 3 characters") &&
    !error.includes("only contain letters")
  ) {
    return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-r from-blue-500 to-purple-500 text-white">
      <div className="bg-red-100 border border-red-300 rounded-xl shadow-lg px-8 py-8 flex flex-col items-center max-w-md w-full">
        <span className="text-5xl mb-3">⚠️</span>
        <h1 className="text-2xl font-bold text-red-700 mb-2">Error</h1>
        <p className="text-stone-700 text-center">
          {error}
          <br />
          <span className="text-blue-700">
            Please enter your city name above to get the weather.
          </span>
        </p>
        <button
          className="mt-6 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow transition text-sm sm:text-base lg:text-lg"
          onClick={handleTryAgain}
        >
          Click to get Your Location
        </button>
      </div>
    </main>
    );
  }

  return (
    <main className="flex flex-col items-center py-8 sm:py-12 gap-4 justify-center bg-gradient-to-r from-blue-500 to-purple-500 text-white min-h-[80vh]">
      <button
        className="mb-1 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow transition text-sm sm:text-base lg:text-lg"
        onClick={handleTryAgain}
      >
        📍 Get My Weather Location
      </button>
      <h1 className="capitalize font-bold text-3xl sm:text-4xl text-center mb-2">
        Current Weather
      </h1>
      <h2 className="text-xl sm:text-lg font-semibold text-center capitalize mb-2">
        {cityName || "City Name"}, {countryName || "Country"}
      </h2>
      <div className="bg-white/90 text-black rounded-lg shadow-lg py-6 flex flex-col gap-y-4 w-full max-w-md">
        <div className="flex flex-col items-center gap-2">
          <span className="text-lg font-bold">{date}</span>
          <div className="flex gap-4 px-4 py-3  items-stretch justify-center w-full">
            {/* Day */}
            <div className="flex flex-col items-center flex-1 rounded-lg py-4 px-2.5 shadow border border-blue-200">
              <img
                src={getIconUrl(dayIcon)}
                alt={dayPhrase}
                className="w-16 h-16 mb-2"
                title="Day"
              />
              <span className="font-semibold sm:text-xl text-lg mb-1">Day</span>
              <span className="text-sm sm:text-lg mb-1">{dayPhrase}</span>
              {dayPrecip && (
                <span className="text-blue-700 text-sm">
                  {dayPrecipIntensity} {dayPrecipType}
                </span>
              )}
            </div>
            {/* Night */}
            <div className="flex flex-col items-center flex-1 rounded-lg p-4 shadow border border-purple-200">
              <img
                src={getIconUrl(nightIcon)}
                alt={nightPhrase}
                className="w-16 h-16 mb-2"
                title="Night"
              />
              <span className="font-semibold sm:text-xl text-lg mb-1">
                Night
              </span>
              <span className="text-sm sm:text-lg mb-1">{nightPhrase}</span>
              {nightPrecip && (
                <span className="text-purple-700 text-sm">
                  {nightPrecipIntensity} {nightPrecipType}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="font-bold">
            Temperature: {minTempCelsuis}°C - {maxTempCelsuis}°C ( {minTemp}°
            {tempUnit} - {maxTemp}°{tempUnit} )
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="bg-gradient-to-r from-blue-400 to-purple-400 text-white px-4 py-2 rounded-lg shadow font-semibold text-center sm:text-lg tracking-wide border border-blue-200 mb-2 w-full max-w-xs">
            {headlineText}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <a
            href={todayForecast.Link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            View detailed forecast
          </a>
        </div>
      </div>
    </main>
  );
}

export default WeatherDisplay;
