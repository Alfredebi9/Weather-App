import { useSelector } from "react-redux";

// get AccuWeather icon URL
const getIconUrl = (iconNum) =>
  `https://developer.accuweather.com/sites/default/files/${iconNum
    .toString()
    .padStart(2, "0")}-s.png`;

// convert Fahrenheit to Celsius
const fahrenheitToCelsius = (f) => Math.round(((f - 32) * 5) / 9);

function Forecast() {
  const { forecast, error } = useSelector((state) => state.location);

  if (!forecast?.DailyForecasts?.length) {
    return null;
  }
  if (error) {
    return (
      <div className="text-center text-red-600 bg-red-100 rounded p-2 my-4">
        <p>{error} Try another city</p>
      </div>
    );
  }
  return (
    <section className="w-full bg-white text-black rounded-lg shadow-lg p-4 mt-5">
      <h2 className="text-2xl font-bold text-center mb-6 text-blue-600">
        5-Day Forecast
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        {forecast.DailyForecasts.map((day) => {
          const date = new Date(day.Date).toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          const minC = fahrenheitToCelsius(day.Temperature.Minimum.Value);
          const maxC = fahrenheitToCelsius(day.Temperature.Maximum.Value);
          return (
            <li
              key={day.Date}
              className="bg-gradient-to-b from-blue-100 to-white p-5 rounded-xl shadow-md flex flex-col items-center transition-transform hover:scale-105"
            >
              <p className="font-semibold text-lg mb-2">{date}</p>
              <img
                src={getIconUrl(day.Day.Icon)}
                alt={day.Day.IconPhrase}
                className="w-14 h-14 mb-1"
                title={day.Day.IconPhrase}
              />
              <p className="mt-1 text-base font-medium">{day.Day.IconPhrase}</p>
              <div className="flex gap-2 mt-2 items-end">
                <span className="text-blue-700 font-bold text-lg">
                  {minC}°C 
                </span>
                <span className="text-gray-500">/</span>
                <span className="text-blue-400 text-lg">{maxC}°C</span>
              </div>
              {day.Day.HasPrecipitation && (
                <span className="text-blue-600 text-xs mt-1">
                  {day.Day.PrecipitationIntensity} {day.Day.PrecipitationType}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
export default Forecast;
