import { useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setCity, setCountry } from "./locationSlice";
import Forecast from "./Forecast";
import Header from "./Header";
import WeatherDisplay from "./WeatherDisplay";
import Loader from "./Loading";
import Form from "./Form";

function App() {
  const dispatch = useDispatch();
  const loaderData = useLoaderData();
  const loading = useSelector((state) => state.location.loading);
  const data = useLoaderData();
  console.log(data, loaderData);
  useEffect(() => {
    if (loaderData?.city && loaderData?.country) {
      dispatch(setCity(loaderData.city));
      dispatch(setCountry(loaderData.country));
    }
  }, [dispatch, loaderData]);

  if (data.error || location.error) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-purple-100">
        <div className="bg-white border border-red-200 rounded-xl shadow-lg px-8 py-10 flex flex-col items-center max-w-md w-full">
          <span className="text-5xl mb-3 text-red-500">⚠️</span>
          <h1 className="text-2xl font-bold text-red-700 mb-2">Oops!</h1>
          <p className="text-center text-red-600 mb-4">
            {data.error}
            <br />
            <span className="text-gray-700">
              Please enter your city below to get the weather.
            </span>
          </p>
          <Form />
        </div>
      </main>
    );
  }

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
