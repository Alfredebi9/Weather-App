import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import store from "./store";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Error from "./Error";
import { FullscreenLoading } from "./Loading";
import { rootLoader } from "./loader.js";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    loader: rootLoader,
    // Shown while the root loader runs (e.g. the first geolocation lookup) so
    // the app never renders a blank screen on initial load.
    HydrateFallback: FullscreenLoading,
    errorElement: <Error />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>
);
