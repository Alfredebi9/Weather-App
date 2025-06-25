import { useSelector } from "react-redux";
import Form from "./Form";

function Header() {
  const { error } = useSelector((state) => state.location);

  const isValidationError =
    error &&
    (error.includes("enter a city") ||
      error.includes("at least 3 characters") ||
      error.includes("only contain letters"));

  return (
    <header className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-6 shadow-md">
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-lg mb-2 sm:mb-0">
          <span role="img" aria-label="weather">
            ⛅
          </span>{" "}
          Weatherly
        </h1>
        <Form />
      </div>
      {isValidationError && (
        <div className="max-w-2xl mx-auto mt-2 text-center">
          <span className="text-red-600 bg-red-100 px-3 py-1 rounded">
            {error}
          </span>
        </div>
      )}
    </header>
  );
}

export default Header;
