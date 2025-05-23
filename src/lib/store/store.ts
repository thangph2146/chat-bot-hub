import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import chatSessionsReducer from './chatSessionsSlice'; // Import chat sessions reducer
import chatMessagesReducer from './chatMessagesSlice'; // Import chat messages reducer

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chatSessions: chatSessionsReducer, // Add chat sessions reducer
    chatMessages: chatMessagesReducer, // Add chat messages reducer
    // Add other reducers here as your application grows
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
