import { WiDaySunny } from "react-icons/wi";

function Loader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-400 to-purple-500">
      <WiDaySunny
        className="animate-spin-slow text-yellow-300 mb-6"
        size={80}
      />
      <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow mb-2">
        Fetching the latest weather...
      </h2>
      <div className="flex gap-1 mt-2">
        <span className="animate-bounce text-white text-2xl">.</span>
        <span
          className="animate-bounce text-white text-2xl"
          style={{ animationDelay: "0.2s" }}
        >
          .
        </span>
        <span
          className="animate-bounce text-white text-2xl"
          style={{ animationDelay: "0.4s" }}
        >
          .
        </span>
      </div>
      <p className="mt-4 text-white/80 text-base text-center max-w-xs">
        Please wait while we gather the most accurate weather data for your
        location.
      </p>
    </div>
  );
}

export default Loader;
