// Error helpers used across the app.
//
// Errors are kept in Redux as small objects ({ type, message }) instead of raw
// strings. That lets the UI tell user-input problems (shown inline in the
// header) apart from location/network problems (shown in the main view) without
// brittle string matching.

export const ERROR_TYPES = {
  VALIDATION: "validation",
  LOCATION: "location",
  NOT_FOUND: "notFound",
  FETCH: "fetch",
};

// Build a validation error (empty / malformed city input).
export function validationError(message) {
  return { type: ERROR_TYPES.VALIDATION, message };
}

export function isValidationError(error) {
  return Boolean(error) && error.type === ERROR_TYPES.VALIDATION;
}

// Read a message from one of our error objects, a plain string, or an Error.
export function getErrorMessage(error, fallback = "") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  return error.message || fallback;
}

// Turn an unexpected error (geolocation, network, configuration) into a short,
// friendly message the user can act on. Never exposes API keys or stack traces.
export function toUserError(error) {
  const message = getErrorMessage(error).toLowerCase();

  if (message.includes("not supported")) {
    return {
      type: ERROR_TYPES.LOCATION,
      message:
        "Your browser does not support location access. Please search for a city above.",
    };
  }
  if (message.includes("denied") || message.includes("permission")) {
    return {
      type: ERROR_TYPES.LOCATION,
      message:
        "We couldn't access your location. Allow location access or search for a city above.",
    };
  }
  if (message.includes("timed out") || message.includes("timeout")) {
    return {
      type: ERROR_TYPES.LOCATION,
      message:
        "Getting your location took too long. Please try again or search for a city above.",
    };
  }
  if (message.includes("api key")) {
    return {
      type: ERROR_TYPES.FETCH,
      message: "A required service is not configured. Please try again later.",
    };
  }
  if (message.includes("city not found")) {
    return {
      type: ERROR_TYPES.VALIDATION,
      message:
        "We couldn't find that city. Please check the spelling or try another city.",
    };
  }

  return {
    type: ERROR_TYPES.FETCH,
    message:
      "Sorry, we couldn't load the weather right now. Please try again or search for another city.",
  };
}