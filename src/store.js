import { configureStore } from "@reduxjs/toolkit";
import locationReducer from "./locationSlice";

const store = configureStore({
  reducer: {
    location: locationReducer,
  },
});

export default store;
