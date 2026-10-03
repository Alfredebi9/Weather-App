import { useSelector } from "react-redux";
import Form from "./Form";
import { getErrorMessage, isValidationError } from "./errors";

function Header() {
  const { error } = useSelector((state) => state.location);

  // Input-validation problems are shown inline here (so the user keeps context
  // while typing). Location/network problems are shown in the main view.
  const showValidationError = isValidationError(error);

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
      {showValidationError && (
        <div className="max-w-2xl mx-auto mt-2 px-4 text-center">
          <span
            className="inline-block text-red-700 bg-red-100 border border-red-200 px-3 py-1 rounded"
            role="alert"
          >
            {getErrorMessage(error)}
          </span>
        </div>
      )}
    </header>
  );
}

export default Header;