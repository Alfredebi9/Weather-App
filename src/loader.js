import {
  getUserLocation,
  getCityFromCoords,
  getWeather,
  getWeatherByCoords,
  getForecastByKey,
} from "./geolocation";

export async function rootLoader() {
  try {
    // Get user's coordinates
    const { latitude, longitude } = await getUserLocation();

    // Get city and country from coordinates
    const cityObject = await getCityFromCoords(latitude, longitude);
    if (!cityObject) throw new Error("Could not get city from coordinates.");
    const { city, country } = cityObject;

    // get weatherInfo using city name
    let cityDetails = null;
    let usedCity = city;
    if (city) {
      cityDetails = await getWeather(city);
    }

    // Fallback: If cityDetails is null, try by coordinates
    if (!cityDetails) {
      cityDetails = await getWeatherByCoords(latitude, longitude);

      //update usedCity to the one AccuWeather recognizes if fallback works,
      if (cityDetails && cityDetails.LocalizedName) {
        usedCity = cityDetails.LocalizedName;
      }
    }

    // If still no cityDetails, throw error
    if (!cityDetails) {
      throw new Error("Unable to find weather information for your location.");
    }

    // Now always use the city name AccuWeather recognizes
    const forecast = await getForecastByKey(usedCity, latitude, longitude);
    console.log(forecast);
    return {
      city: cityDetails.LocalizedName || city,
      country: cityDetails.Country?.LocalizedName || country,
      latitude,
      longitude,
      cityInfo: cityDetails,
      forecast,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

