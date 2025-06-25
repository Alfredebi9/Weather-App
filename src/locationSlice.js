import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  city: "",
  country: "",
  loading: false,
  error: null,
  forecast: null,
};

const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    setCity: (state, action) => {
      if (state.city === action.payload) {
        return;
      }
      state.city = action.payload;
    },
    setCountry: (state, action) => {
      if (state.country === action.payload) {
        return;
      }
      state.country = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setForecast: (state, action) => {
      state.forecast = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setCity, setCountry, setLoading, setForecast,setError } =
  locationSlice.actions;
export default locationSlice.reducer;
