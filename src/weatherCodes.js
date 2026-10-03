import {
  WiCloudy,
  WiDayCloudy,
  WiDayShowers,
  WiDaySunny,
  WiFog,
  WiNightAltCloudy,
  WiNightClear,
  WiRain,
  WiRainMix,
  WiShowers,
  WiSleet,
  WiSnow,
  WiSprinkle,
  WiThunderstorm,
} from "react-icons/wi";

// Maintainable mapping for the WMO weather interpretation codes returned by
// Open-Meteo (https://open-meteo.com/en/docs -> "WMO Weather interpretation
// codes"). Codes are grouped by their description and day/night variants are
// provided where the meaning differs at night.
const WEATHER_CODES = {
  0: { label: "Clear sky", Icon: WiDaySunny, NightIcon: WiNightClear },
  1: { label: "Mainly clear", Icon: WiDaySunny, NightIcon: WiNightClear },
  2: { label: "Partly cloudy", Icon: WiDayCloudy, NightIcon: WiNightAltCloudy },
  3: { label: "Overcast", Icon: WiCloudy },
  45: { label: "Fog", Icon: WiFog },
  48: { label: "Depositing rime fog", Icon: WiFog },
  51: { label: "Light drizzle", Icon: WiSprinkle },
  53: { label: "Moderate drizzle", Icon: WiSprinkle },
  55: { label: "Dense drizzle", Icon: WiSprinkle },
  56: { label: "Light freezing drizzle", Icon: WiSleet },
  57: { label: "Dense freezing drizzle", Icon: WiSleet },
  61: { label: "Slight rain", Icon: WiRain },
  63: { label: "Moderate rain", Icon: WiRain },
  65: { label: "Heavy rain", Icon: WiRain },
  66: { label: "Light freezing rain", Icon: WiRainMix },
  67: { label: "Heavy freezing rain", Icon: WiRainMix },
  71: { label: "Slight snowfall", Icon: WiSnow },
  73: { label: "Moderate snowfall", Icon: WiSnow },
  75: { label: "Heavy snowfall", Icon: WiSnow },
  77: { label: "Snow grains", Icon: WiSnow },
  80: { label: "Slight rain showers", Icon: WiDayShowers },
  81: { label: "Moderate rain showers", Icon: WiShowers },
  82: { label: "Violent rain showers", Icon: WiShowers },
  85: { label: "Slight snow showers", Icon: WiSnow },
  86: { label: "Heavy snow showers", Icon: WiSnow },
  95: { label: "Thunderstorm", Icon: WiThunderstorm },
  96: { label: "Thunderstorm with slight hail", Icon: WiThunderstorm },
  99: { label: "Thunderstorm with heavy hail", Icon: WiThunderstorm },
};

const UNKNOWN = { label: "Unknown conditions", Icon: WiCloudy };

// Resolve a code (and current day/night flag) into a label and icon component.
export function getWeatherInfo(code, isDay = true) {
  const entry = WEATHER_CODES[code] || UNKNOWN;
  const Icon = !isDay && entry.NightIcon ? entry.NightIcon : entry.Icon;
  return { label: entry.label, Icon };
}