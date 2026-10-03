import { useNavigate, useRouteError } from "react-router-dom";
import { getErrorMessage, isValidationError } from "./errors";
import Form from "./Form";

// Route-level error boundary. Rendered when the root loader throws (for
// example when location access is blocked) or when any unexpected router error
// occurs. Message props let it double as a plain, reusable error card.
function Error({ message, onRetry }) {
  const error = useRouteError();
  const navigate = useNavigate();

  // Show the search form whenever recovering is plausible: when rendered
  // imperatively (no route error) or for thrown/runtime errors. A hard 404/500
  // response is not something a city search can fix.
  const showSearch = !error || !error.status;

  const displayMessage =
    message ||
    (!isValidationError(error)
      ? getErrorMessage(error)
      : "") ||
    "An unexpected error occurred. Please try again.";

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Re-run the route loader to request location again.
      navigate(".", { replace: true });
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-8">
      <div className="bg-white border border-red-200 rounded-xl shadow-lg px-8 py-10 flex flex-col items-center max-w-md w-full">
        <span className="text-5xl mb-3" role="img" aria-label="warning">
          ⚠️
        </span>
        <h1 className="text-2xl font-bold text-red-700 mb-2">
          Something went wrong
        </h1>
        <p className="text-center text-red-600 mb-4">{displayMessage}</p>

        <button
          type="button"
          onClick={handleRetry}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow transition"
        >
          Try again
        </button>

        {showSearch && (
          <div className="w-full mt-6 flex flex-col items-center">
            <span className="text-gray-700 mb-2">
              Or search for a city instead:
            </span>
            <Form />
          </div>
        )}
      </div>
    </main>
  );
}

export default Error;