import { useSelector } from "react-redux";
import {
  celsiusToFahrenheit,
  formatDate,
  roundTemperature,
} from "./weatherUtils";
import { getWeatherInfo } from "./weatherCodes";

function Forecast() {
  const forecast = useSelector((state) => state.location.forecast);
  const days = forecast?.daily;

  // Today (daily[0]) is already represented by the current-weather card above,
  // so only the days AFTER today are listed here to avoid duplicating it.
  // Open-Meteo is asked for 7 days -> 1 "today" + 6 future days.
  const futureDays = Array.isArray(days) ? days.slice(1) : [];

  // Loading/error states are owned by WeatherDisplay so the user never sees two
  // different messages at once.
  if (futureDays.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-white text-slate-900 rounded-lg shadow-lg p-4 mt-5">
      <h2 className="text-2xl font-bold text-center mb-6 text-blue-600">
        {futureDays.length}-Day Forecast
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {futureDays.map((day, index) => {
          const label =
            formatDate(day.date, {
              weekday: "short",
              month: "short",
              day: "numeric",
            }) || "Unknown date";
          const { label: condition, Icon } = getWeatherInfo(day.weatherCode);
          const maxC = roundTemperature(day.temperatureMax);
          const minC = roundTemperature(day.temperatureMin);
          const maxF = celsiusToFahrenheit(day.temperatureMax);
          const minF = celsiusToFahrenheit(day.temperatureMin);
          const rainChance = Number.isFinite(
            Number(day.precipitationProbability)
          )
            ? Math.round(day.precipitationProbability)
            : null;

          return (
            <li
              key={day.date ?? index}
              className="bg-gradient-to-b from-blue-100 to-white p-5 rounded-xl shadow-md flex flex-col items-center transition-transform hover:scale-105"
            >
              <p className="font-semibold text-lg mb-2">{label}</p>
              <Icon className="w-14 h-14 text-blue-500" aria-hidden="true" />
              <p className="mt-1 text-base font-medium text-center min-h-[1.5rem]">
                {condition}
              </p>
              <div className="flex gap-2 mt-2 items-end">
                <span className="text-blue-700 font-bold text-lg">
                  {minC === null ? "—" : `${minC}°C`}
                </span>
                <span className="text-gray-500">/</span>
                <span className="text-blue-400 text-lg">
                  {maxC === null ? "—" : `${maxC}°C`}
                </span>
              </div>
              {(minF !== null || maxF !== null) && (
                <span className="text-xs text-gray-500 mt-1">
                  {minF === null ? "—" : `${minF}°F`} /{" "}
                  {maxF === null ? "—" : `${maxF}°F`}
                </span>
              )}
              {rainChance !== null && (
                <span className="text-blue-600 text-xs mt-1">
                  💧 {rainChance}% chance
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-center text-xs text-gray-400 mt-4">
        Weather data by Open-Meteo.com
      </p>
    </section>
  );
}

export default Forecast;