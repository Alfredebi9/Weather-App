import { getCityFromCoords, getUserLocation } from "./weatherApi";

// Root loader: resolves the visitor's coordinates before the app renders and,
// when possible, a human-readable city/country label via reverse geocoding.
//
// The forecast itself is fetched by <WeatherDisplay /> straight from the
// coordinates, so a reverse-geocoding failure only costs us the label — the
// weather still loads. Only a geolocation failure is treated as an error.
export async function rootLoader() {
  try {
    const { latitude, longitude } = await getUserLocation();

    let city = "";
    let country = "";
    try {
      const place = await getCityFromCoords(latitude, longitude);
      city = place.city;
      country = place.country;
    } catch (labelError) {
      // Non-fatal: we can still show weather for these coordinates.
      console.warn(
        "Could not resolve a place name for your coordinates:",
        labelError
      );
    }

    return { city, country, latitude, longitude };
  } catch (error) {
    return {
      city: "",
      country: "",
      latitude: null,
      longitude: null,
      error: error?.message || "Could not determine your location.",
    };
  }
}