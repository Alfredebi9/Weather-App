import { WiDaySunny } from "react-icons/wi";

// Reusable loading indicator.
// - `fullscreen`: covers the whole viewport (used on first load / heavy work).
// - `overlay`: a compact card used on top of existing content for refreshes.
// - default: an inline spinner for local, section-level loading.
function Loading({ label, variant = "inline" }) {
  const text = label || "Fetching the latest weather...";

  if (variant === "overlay" || variant === "fullscreen") {
    const isFullscreen = variant === "fullscreen";
    return (
      <div
        className={
          isFullscreen
            ? "fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500"
            : "fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        }
        role="status"
        aria-live="polite"
      >
        <div
          className={
            isFullscreen
              ? "flex flex-col items-center justify-center px-4 text-center"
              : "flex flex-col items-center justify-center bg-white/95 rounded-xl shadow-lg px-8 py-8 text-center max-w-sm w-full mx-4"
          }
        >
          <WiDaySunny
            className="animate-spin-slow text-yellow-400"
            size={isFullscreen ? 80 : 56}
          />
          <h2
            className={`font-bold drop-shadow ${
              isFullscreen ? "text-white mt-6" : "text-blue-700 mt-4"
            } text-xl sm:text-2xl`}
          >
            {text}
          </h2>
          <div className="flex gap-1 mt-2" aria-hidden="true">
            <span
              className={`animate-bounce text-xl ${
                isFullscreen ? "text-white" : "text-blue-600"
              }`}
            >
              .
            </span>
            <span
              className={`animate-bounce text-xl ${
                isFullscreen ? "text-white" : "text-blue-600"
              }`}
              style={{ animationDelay: "0.2s" }}
            >
              .
            </span>
            <span
              className={`animate-bounce text-xl ${
                isFullscreen ? "text-white" : "text-blue-600"
              }`}
              style={{ animationDelay: "0.4s" }}
            >
              .
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-2 text-blue-600"
      role="status"
      aria-live="polite"
    >
      <WiDaySunny className="animate-spin-slow text-yellow-400" size={28} />
      <span className="text-sm font-medium">{text}</span>
    </span>
  );
}

export default Loading;

// Full-viewport loader used as the router's initial-load fallback
// (`HydrateFallback`). Exported so `main.jsx` doesn't need to define a
// component (which would break Fast Refresh).
export function FullscreenLoading({ label }) {
  return <Loading variant="fullscreen" label={label} />;
}