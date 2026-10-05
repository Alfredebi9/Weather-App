# Weather App

A responsive React weather application that provides current weather conditions and a 7-day forecast for searched cities or the user's current location.
The application uses Open-Meteo for weather forecasts and city search, with Geoapify used for optional reverse geocoding when retrieving the user's current location.

## Features

- Current weather conditions
- 7-day weather forecast
  - Today is displayed prominently with the current weather
  - The following 6 days are displayed as forecast cards
- Search for weather by city
- City suggestions while searching
- Current-location weather using browser geolocation
- Celsius and Fahrenheit temperatures
- Daily high and low temperatures
- Humidity
- Wind speed
- Precipitation information
- Weather condition icons based on WMO weather codes
- Accessible loading and status indicators
- Friendly error handling
- Graceful handling of missing weather data
- Responsive layout for desktop and mobile devices
- Automatic weather refresh (3hrs)

## Stack

- React
- Vite
- Redux Toolkit
- React Redux
- React Router
- Tailwind CSS
- React Icons
- Open-Meteo API
- Geoapify

## Weather Data

### Open-Meteo

Open-Meteo is the primary weather provider.

The application uses Open-Meteo for:

- Current weather conditions
- Daily forecasts
- City search and forward geocoding
- Temperature
- Weather codes
- Relative humidity
- Apparent temperature
- Wind speed
- Precipitation
- Daily minimum and maximum temperatures
- Precipitation probability

The application requests 7 forecast days.

### Geoapify

Geoapify is used only for reverse geocoding when the application retrieves the user's browser location.

The flow is: Browser Geolocation -> Latitude + Longitude -> Geoapify Reverse Geocoding -> City + Country

Geoapify is optional for weather retrieval. If reverse geocoding fails or the API key is unavailable, weather can still be loaded from the coordinates and the location label falls back gracefully.

## How It Works

### Search by city

User enters city -> Open-Meteo Geocoding API -> Latitude + Longitude -> Open-Meteo Forecast API -> Current Weather + 7-Day Forecast.

### Use current location

Get My Weather Location -> Browser Geolocation -> Latitude + Longitude -> Geoapify Reverse Geocoding -> Location Name -> Open-Meteo Forecast API -> Current Weather + 7-Day Forecast.

## Forecast Structure

The application retrieves 7-days of forecast data.

Day 1 (current day): Displayed with the current-weather section

Days 2 to 7: Future forecast, displayed as six forecast cards.

## Loading Behaviour

The application uses different loading behaviour depending on the operation.

### Initial weather load

When there is no weather available yet, the application displays a full loading state.

### Changing cities

When a new city is selected, the previous location's forecast is cleared and the application displays the loading state while retrieving the new weather.

### Get My Weather Location

When Get My Weather Location is selected:

1. The location operation starts immediately.
2. The button is temporarily disabled to prevent duplicate requests.
3. Browser geolocation retrieves the current coordinates.
4. Reverse geocoding attempts to determine the city and country.
5. Weather is requested for the coordinates.
6. The loading state is cleared when the operation completes or fails.
7. Button remains available after completion so the user can refresh the current location again.

### Background refresh

Automatic weather refresh does not hide weather already displayed on the screen.
Instead, existing weather remains visible while a subtle **Updating...** status indicates that new data is being retrieved.

## Error Handling

The application handles errors such as:

- Browser geolocation denied or unavailable
- City not found
- Invalid search input
- Weather request failures
- Network failures
- Reverse-geocoding failures
- Missing weather information

Validation errors are displayed close to the search interface, while weather and location errors are displayed more prominently.
