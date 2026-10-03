import { useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setCity, setCoordinates, setCountry } from "./locationSlice";
import Forecast from "./Forecast";
import Header from "./Header";
import WeatherDisplay from "./WeatherDisplay";
import Loading from "./Loading";
import Error from "./Error";
import { toUserError } from "./errors";

function App() {
  const dispatch = useDispatch();
  const loaderData = useLoaderData();
  const loading = useSelector((state) => state.location.loading);
  const forecast = useSelector((state) => state.location.forecast);
  const reduxCity = useSelector((state) => state.location.city);

  // Seed the store with the location the loader resolved.
  useEffect(() => {
    if (loaderData?.city) {
      dispatch(setCity(loaderData.city));
    }
    if (loaderData?.country) {
      dispatch(setCountry(loaderData.country));
    }
    if (loaderData?.latitude != null && loaderData?.longitude != null) {
      dispatch(
        setCoordinates({
          latitude: loaderData.latitude,
          longitude: loaderData.longitude,
        })
      );
    }
  }, [dispatch, loaderData]);

  // If we could not determine a location at all, show a friendly error view
  // (with a search form) so the user can keep going. Once they pick a city,
  // `reduxCity` becomes set and we render the normal app instead.
  const hasCity = Boolean(loaderData?.city) || Boolean(reduxCity);
  if (loaderData?.error && !hasCity) {
    const userError = toUserError(loaderData.error);
    return <Error message={userError.message} />;
  }

  // Blocking full-screen loading is ONLY used when there is no weather to show.
  // Background refreshes keep the existing weather visible (WeatherDisplay
  // shows a subtle indicator instead).
  const showBlockingLoader = loading && !forecast;

  return (
    <>
      {showBlockingLoader && (
        <Loading variant="overlay" label="Fetching the latest weather..." />
      )}
      <div>
        <Header />
        <WeatherDisplay />
        <Forecast />
      </div>
    </>
  );
}

export default App;