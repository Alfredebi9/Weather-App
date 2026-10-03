import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCityFromCoords, getForecast, getUserLocation } from "./weatherApi";
import {
  setCity,
  setCoordinates,
  setCountry,
  setError,
  setForecast,
  setLoading,
} from "./locationSlice";
import {
  celsiusToFahrenheit,
  formatDateTime,
  roundTemperature,
} from "./weatherUtils";
import { getWeatherInfo } from "./weatherCodes";
import { ERROR_TYPES, isValidationError, toUserError } from "./errors";
import Loading from "./Loading";

// Small labelled metric used in the current-conditions grid.
function Metric({ label, value }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span className="font-semibold text-gray-800 text-center">{value}</span>
    </div>
  );
}

function WeatherDisplay() {
  const {
    city: cityName,
    country: countryName,
    latitude,
    longitude,
    forecast,
    error,
    loading,
  } = useSelector((state) => state.location);
  const dispatch = useDispatch();
  const [refreshToken, setRefreshToken] = useState(0);
  // `locating` is true from the moment "Get My Weather Location" is pressed
  // until the resulting weather request has settled. It gives immediate
  // feedback and keeps the button disabled for the whole operation, while
  // `locatingRef` is a hard re-entry guard so a double click cannot start two
  // overlapping location requests.
  const [locating, setLocating] = useState(false);
  const locatingRef = useRef(false);
  // Tracks whether the forecast request that follows a location change has
  // started, so we know exactly when to release `locating`.
  const sawForecastLoadRef = useRef(false);

  const loadForecast = useCallback(
    async (lat, lon) => {
      try {
        dispatch(setError(null));
        dispatch(setLoading(true));
        const data = await getForecast(lat, lon, 7);
        if (!data?.daily?.length) {
          dispatch(setForecast(null));
          dispatch(
            setError({
              type: ERROR_TYPES.FETCH,
              message:
                "No forecast data is available for this location right now.",
            })
          );
          return;
        }
        dispatch(setForecast(data));
      } catch (err) {
        dispatch(setError(toUserError(err)));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  // Fetch on location change and auto-refresh every 3 hours. A background
  // refresh does NOT clear the current forecast, so existing weather stays
  // visible while new data is fetched.
  useEffect(() => {
    if (latitude == null || longitude == null) return undefined;
    loadForecast(latitude, longitude);
    const id = setInterval(
      () => loadForecast(latitude, longitude),
      3 * 60 * 60 * 1000
    );
    return () => clearInterval(id);
  }, [latitude, longitude, cityName, refreshToken, loadForecast]);

  // Release the "locating" state only after the forecast request triggered by
  // the new coordinates has settled. This keeps the button disabled across the
  // whole location -> weather transition, and is unaffected by the automatic
  // background refresh (which never sets `locating`).
  useEffect(() => {
    if (!locating) {
      sawForecastLoadRef.current = false;
      return;
    }
    if (loading) {
      sawForecastLoadRef.current = true;
      return;
    }
    if (sawForecastLoadRef.current) {
      sawForecastLoadRef.current = false;
      locatingRef.current = false;
      setLocating(false);
    }
  }, [locating, loading]);

  // Explicit "use my location" action. It starts the loading state immediately,
  // guards against duplicate requests, always refreshes (even if the
  // coordinates are unchanged) and drops the previous forecast so the blocking
  // loader is shown for the new location.
  const handleUseMyLocation = async () => {
    if (locatingRef.current) return;
    locatingRef.current = true;
    setLocating(true);
    // Immediate feedback, and it keeps the button disabled for the whole flow.
    dispatch(setLoading(true));

    try {
      dispatch(setError(null));
      const { latitude: lat, longitude: lon } = await getUserLocation();

      let city = "";
      let country = "";
      try {
        const place = await getCityFromCoords(lat, lon);
        city = place.city;
        country = place.country;
      } catch (labelError) {
        // The place name is optional; weather still works by coordinates.
        console.warn("Could not resolve a place name:", labelError);
      }

      dispatch(setCity(city));
      dispatch(setCountry(country));
      dispatch(setForecast(null));
      dispatch(setCoordinates({ latitude: lat, longitude: lon }));
      setRefreshToken((value) => value + 1);
      // `loading` intentionally stays true: the forecast effect sets it false
      // once the new weather arrives (or fails), after which the effect above
      // re-enables the button.
    } catch (err) {
      // Stay recoverable: surface the error and release every busy state.
      dispatch(setError(toUserError(err)));
      dispatch(setLoading(false));
      locatingRef.current = false;
      setLocating(false);
    }
  };

  const hasForecast = Boolean(forecast?.current && forecast.daily?.length);
  // Validation errors belong in the header, not in this main view.
  const showError = Boolean(error) && !isValidationError(error);
  // A refresh while weather is already on screen should be subtle.
  const isRefreshing = loading && hasForecast;

  // 1) Error state: something went wrong and we have nothing to display.
  if (!hasForecast && showError) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-8">
        <div className="bg-red-100 border border-red-300 rounded-xl shadow-lg px-8 py-8 flex flex-col items-center max-w-md w-full">
          <span className="text-5xl mb-3" role="img" aria-label="warning">
            ⚠️
          </span>
          <h1 className="text-2xl font-bold text-red-700 mb-2">
            Weather unavailable
          </h1>
          <p className="text-stone-700 text-center">
            {error.message}
            <br />
            <span className="text-blue-700">
              Please enter your city name above to get the weather.
            </span>
          </p>
          <button
            className="mt-6 px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-semibold shadow transition text-sm sm:text-base"
            onClick={handleUseMyLocation}
            disabled={locating}
            aria-busy={locating}
          >
            {locating ? "Getting your location…" : "Click to get Your Location"}
          </button>
        </div>
      </main>
    );
  }

  // 2) Loading / empty state: no forecast yet, but no error either.
  if (!hasForecast) {
    return (
      <main className="flex flex-col items-center py-6 sm:py-9 gap-6 justify-center bg-gradient-to-r from-blue-500 to-purple-500 text-white min-h-[50vh] px-4">
        <h1 className="capitalize font-bold text-3xl text-center">
          Current Weather
        </h1>
        {loading || latitude != null ? (
          <Loading label="Fetching the latest weather..." />
        ) : (
          <p className="text-center max-w-xs">
            Search for a city to see its weather.
          </p>
        )}
      </main>
    );
  }

  const current = forecast.current;
  // The first daily entry is "today" at the location. It is shown here, in the
  // current-weather section, and deliberately excluded from the future forecast
  // list below so today is never duplicated.
  const today = forecast.daily[0];
  const units = forecast.units;
  const { label: condition, Icon } = getWeatherInfo(
    current.weatherCode,
    current.isDay
  );

  const tempC = roundTemperature(current.temperature);
  const tempF = celsiusToFahrenheit(current.temperature);
  const feelsC = roundTemperature(current.apparentTemperature);
  const highC = roundTemperature(today?.temperatureMax);
  const highF = celsiusToFahrenheit(today?.temperatureMax);
  const lowC = roundTemperature(today?.temperatureMin);
  const lowF = celsiusToFahrenheit(today?.temperatureMin);
  const humidity = Number.isFinite(Number(current.humidity))
    ? Math.round(Number(current.humidity))
    : null;
  const wind = Number.isFinite(Number(current.windSpeed))
    ? Math.round(Number(current.windSpeed))
    : null;
  const precipitation = Number.isFinite(Number(current.precipitation))
    ? Number(current.precipitation)
    : null;
  const observedAt = formatDateTime(current.time, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 3) Success state.
  return (
    <main className="flex flex-col items-center py-8 sm:py-12 gap-4 justify-center bg-gradient-to-r from-blue-500 to-purple-500 text-white min-h-[60vh] px-4">
      <button
        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-semibold shadow transition text-sm sm:text-base"
        onClick={handleUseMyLocation}
        disabled={locating}
        aria-busy={locating}
      >
        {locating ? "Getting your location…" : "Get My Weather Location"}
      </button>

      <h1 className="font-bold text-3xl sm:text-4xl text-center">
        Current Weather
      </h1>
      <h2 className="text-lg sm:text-xl font-semibold text-center capitalize">
        {cityName || "Your location"}
        {countryName ? `, ${countryName}` : ""}
      </h2>

      {showError && (
        <p
          role="alert"
          className="bg-red-100 text-red-700 border border-red-300 rounded-lg px-4 py-2 max-w-md text-center text-sm"
        >
          {error.message}
        </p>
      )}

      <div
        className="bg-white/95 text-slate-900 rounded-2xl shadow-lg p-5 sm:p-6 flex flex-col gap-5 w-full max-w-md"
        aria-busy={isRefreshing}
      >
        <div className="flex items-center justify-between gap-2 text-sm text-gray-500 min-h-[1.25rem]">
          <span>{observedAt || "Latest observation"}</span>
          {isRefreshing && (
            <span
              className="inline-flex items-center gap-1 text-blue-600"
              role="status"
              aria-live="polite"
            >
              <span
                className="h-2 w-2 rounded-full bg-blue-500 animate-ping"
                aria-hidden="true"
              />
              {locating ? "Locating…" : "Updating…"}
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          <Icon className="w-24 h-24 text-blue-500 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-5xl font-bold text-slate-800 leading-none">
              {tempC === null ? "—" : `${tempC}°`}
              <span className="text-2xl align-top text-slate-500 ml-0.5">C</span>
            </p>
            <p className="text-sm text-gray-500 min-h-[1.25rem]">
              {tempF === null ? "" : `${tempF}°F`}
            </p>
            <p className="text-lg font-medium mt-1">{condition}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-gray-200 pt-4">
          <Metric
            label="Feels like"
            value={feelsC === null ? "—" : `${feelsC}°C`}
          />
          <Metric
            label="Humidity"
            value={humidity === null ? "—" : `${humidity}%`}
          />
          <Metric
            label="Wind"
            value={wind === null ? "—" : `${wind} ${units.windSpeed}`}
          />
        </div>

        <div className="border-t border-gray-200 pt-4 text-center">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
            Today
          </p>
          <div className="flex justify-center gap-10">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                High
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {highC === null ? "—" : `${highC}°C`}
              </p>
              <p className="text-xs text-gray-500">
                {highF === null ? "" : `${highF}°F`}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Low
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {lowC === null ? "—" : `${lowC}°C`}
              </p>
              <p className="text-xs text-gray-500">
                {lowF === null ? "" : `${lowF}°F`}
              </p>
            </div>
          </div>
        </div>

        {precipitation !== null && precipitation > 0 && (
          <p className="text-center text-sm text-blue-700">
            Precipitation: {precipitation} {units.precipitation}
          </p>
        )}
      </div>
    </main>
  );
}

export default WeatherDisplay;