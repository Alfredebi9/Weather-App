import { useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setCity, setCountry } from "./locationSlice";
import Forecast from "./Forecast";
import Header from "./Header";
import WeatherDisplay from "./WeatherDisplay";
import Loader from "./Loading";

function App() {
  const dispatch = useDispatch();
  const loaderData = useLoaderData();
  // console.log(loaderData);
  const loading = useSelector((state) => state.location.loading);

  useEffect(() => {
    if (loaderData?.city && loaderData?.country) {
      dispatch(setCity(loaderData.city));
      dispatch(setCountry(loaderData.country));
    }
  }, [dispatch, loaderData]);

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 w-full flex items-center justify-center bg-black/40">
          <Loader />
        </div>
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
