import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GoogleVerifyResponseData } from '@/lib/apiClient'; // Assuming this type is exported from apiClient

export interface AuthState {
  token: string | null;
  userInfo: GoogleVerifyResponseData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  userInfo: null,
  isAuthenticated: false,
  isLoading: true, // Changed: Start with isLoading true
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthLoading: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    setAuthSuccess: (state, action: PayloadAction<{ token: string; user: GoogleVerifyResponseData }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.userInfo = action.payload.user;
      state.error = null;
    },
    setAuthError: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.token = null;
      state.userInfo = null;
      state.error = action.payload;
    },
    clearAuth: (state) => {
      state.token = null;
      state.userInfo = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    // Action to initialize auth state from localStorage (e.g., on app load)
    initializeAuth: (state, action: PayloadAction<{ token: string | null; user: GoogleVerifyResponseData | null }>) => {
      if (action.payload.token && action.payload.user) {
        state.token = action.payload.token;
        state.userInfo = action.payload.user;
        state.isAuthenticated = true;
      } else {
        // Ensure consistent unauthenticated state if token/user is missing
        state.token = null;
        state.userInfo = null;
        state.isAuthenticated = false;
      }
      state.isLoading = false; // This will be set to false after initialization
      state.error = null;
    }
  },
});

export const {
  setAuthLoading,
  setAuthSuccess,
  setAuthError,
  clearAuth,
  initializeAuth,
} = authSlice.actions;

export default authSlice.reducer;
