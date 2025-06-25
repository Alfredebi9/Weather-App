import { useRouteError } from "react-router-dom";

function Error({ message }) {
  const error = useRouteError();
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] bg-red-50 rounded-lg shadow p-6 my-8">
      <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
      <p className="text-red-700 text-lg text-center">
        {message ||
          error?.statusText ||
          error?.message ||
          "An unexpected error occurred."}
      </p>
    </div>
  );
}

export default Error;
