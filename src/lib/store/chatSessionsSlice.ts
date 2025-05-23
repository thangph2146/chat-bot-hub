import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../apiClient'; 
import { API_ENDPOINTS } from '@/config/api.config';
import { ChatSession, ChatMessage } from '../types/chat';
import logger from '../logger';

const SLICE_NAME = 'chatSessions';
const sessionLogger = (actionType: string, message?: string) => logger.info(SLICE_NAME, `${actionType}${message ? `: ${message}` : ''}`);


export interface ChatSessionsState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
  createError: string | null;
  isSendingMessage: boolean;
  sendMessageError: string | null;
}

const initialState: ChatSessionsState = {
  sessions: [],
  currentSessionId: null,
  isLoading: false,
  error: null,
  isCreating: false,
  createError: null,
  isSendingMessage: false,
  sendMessageError: null,
};

// Async thunk for fetching chat sessions by user ID (now includes messages)
export const fetchChatSessionsByUser = createAsyncThunk<ChatSession[], string, { rejectValue: string }>(
  `${SLICE_NAME}/fetchByUser`,
  async (userId, { rejectWithValue }) => {
    sessionLogger(`Thunk: fetchChatSessionsByUser for user`, userId);
    try {
      const endpoint = API_ENDPOINTS.SESSIONS_BY_USER(userId);
      // Assuming the backend now returns ChatSession[] with embedded messages
      const response = await apiClient.get<ChatSession[]>(endpoint);
      sessionLogger(`Thunk: fetchChatSessionsByUser successful for user ${userId}, got ${response.data.length} sessions.`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch chat sessions';
      sessionLogger(`Thunk: fetchChatSessionsByUser failed for user ${userId}`, errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for creating a new chat session
export const createChatSession = createAsyncThunk<ChatSession, { userId: number; title?: string }, { rejectValue: string }>(
  `${SLICE_NAME}/create`,
  async (sessionData, { rejectWithValue }) => {
    sessionLogger(`Thunk: createChatSession with data`, JSON.stringify(sessionData));
    try {
      const response = await apiClient.post<ChatSession>(API_ENDPOINTS.SESSIONS, sessionData);
      // Expecting the created session, possibly with an initial message from the backend
      sessionLogger(`Thunk: createChatSession successful`, JSON.stringify(response.data));
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create chat session';
      sessionLogger(`Thunk: createChatSession failed`, errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for sending a chat message (moved here)
export const sendChatMessageToSession = createAsyncThunk<
  ChatMessage, // Return type (the sent message, confirmed by backend)
  { sessionId: string; userId: number; content: string; senderName: string; isUser: boolean; [key: string]: any }, // Argument type
  { rejectValue: { sessionId: string; error: string } } // Reject value type
>(
  `${SLICE_NAME}/sendMessageToSession`,
  async (messageData, { rejectWithValue }) => {
    const { sessionId, content } = messageData;
    sessionLogger(`Thunk: sendChatMessageToSession to session ${sessionId}`, content);
    try {
      // Payload for the POST request, ensure it matches backend expectations
      // The backend might infer some fields like `isUser` or `senderName` based on context/auth
      const payload = { ...messageData }; 
      const response = await apiClient.post<ChatMessage>(API_ENDPOINTS.CHAT_MESSAGES, payload);
      sessionLogger(`Thunk: sendChatMessageToSession successful for session ${sessionId}`, JSON.stringify(response.data));
      return response.data; // Assuming backend returns the created message
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send message';
      sessionLogger(`Thunk: sendChatMessageToSession failed for session ${sessionId}`, errorMessage);
      return rejectWithValue({ sessionId, error: errorMessage });
    }
  }
);


const chatSessionsSlice = createSlice({
  name: SLICE_NAME,
  initialState,
  reducers: {
    setCurrentSessionId: (state, action: PayloadAction<string | null>) => {
      sessionLogger(`Reducer: setCurrentSessionId to ${action.payload}`);
      state.currentSessionId = action.payload;
    },
    clearChatSessionsError: (state) => {
      state.error = null;
      state.createError = null;
      state.sendMessageError = null;
    },
    // Example: Add a message optimistically if needed, though thunk handles server response
    // addMessageToSessionOptimistic: (state, action: PayloadAction<ChatMessage>) => {
    //   const session = state.sessions.find(s => s.id === action.payload.sessionId);
    //   if (session) {
    //     session.messages.push(action.payload);
    //   }
    // }
  },
  extraReducers: (builder) => {
    builder
      // Fetch sessions
      .addCase(fetchChatSessionsByUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChatSessionsByUser.fulfilled, (state, action: PayloadAction<ChatSession[]>) => {
        state.isLoading = false;
        state.sessions = action.payload;
        // Optionally, if no currentSessionId is set and sessions are loaded, set one.
        // if (!state.currentSessionId && action.payload.length > 0) {
        //   state.currentSessionId = action.payload[0].id;
        // }
      })
      .addCase(fetchChatSessionsByUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch sessions';
      })
      // Create session
      .addCase(createChatSession.pending, (state) => {
        state.isCreating = true;
        state.createError = null;
      })
      .addCase(createChatSession.fulfilled, (state, action: PayloadAction<ChatSession>) => {
        state.isCreating = false;
        state.sessions.unshift(action.payload); 
        state.currentSessionId = action.payload.id; 
      })
      .addCase(createChatSession.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.payload ?? 'Failed to create session';
      })
      // Send message to session
      .addCase(sendChatMessageToSession.pending, (state) => {
        state.isSendingMessage = true;
        state.sendMessageError = null;
      })
      .addCase(sendChatMessageToSession.fulfilled, (state, action: PayloadAction<ChatMessage>) => {
        state.isSendingMessage = false;
        const newMessage = action.payload;
        const session = state.sessions.find(s => s.id === newMessage.sessionId);
        if (session) {
          session.messages.push(newMessage);
          session.lastUpdatedAt = new Date().toISOString(); // Update lastUpdatedAt timestamp
        } else {
          // This case should ideally not happen if session exists
          sessionLogger('Reducer: sendChatMessageToSession.fulfilled', `Session ${newMessage.sessionId} not found to add message.`);
        }
      })
      .addCase(sendChatMessageToSession.rejected, (state, action) => {
        state.isSendingMessage = false;
        state.sendMessageError = action.payload?.error ?? 'Failed to send message';
      });
  },
});

export const { setCurrentSessionId, clearChatSessionsError } = chatSessionsSlice.actions;
export default chatSessionsSlice.reducer;
