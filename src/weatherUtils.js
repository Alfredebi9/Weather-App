// Shared helpers for turning Open-Meteo data into safe display values. They
// live here so the current-weather card and the multi-day forecast stay
// consistent and handle missing values the same way.

// Convert Celsius to Fahrenheit. Returns null (not NaN) when the input is
// missing, so components can show "—" instead of "NaN°F".
export function celsiusToFahrenheit(celsius) {
  const value = Number(celsius);
  if (!Number.isFinite(value)) return null;
  return Math.round((value * 9) / 5 + 32);
}

// Round a Celsius value for display, returning null when it is missing.
export function roundTemperature(celsius) {
  const value = Number(celsius);
  if (!Number.isFinite(value)) return null;
  return Math.round(value);
}

// Format a date value, returning null for missing/invalid input.
// Date-only strings ("YYYY-MM-DD", as returned by Open-Meteo's daily arrays)
// are parsed as LOCAL dates so the weekday is not shifted by UTC conversion.
export function formatDate(value, options) {
  if (!value) return null;
  let date;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(value);
  }
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, options);
}

// Like formatDate but includes the time (for "observed at" labels).
export function formatDateTime(value, options) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, options);
}