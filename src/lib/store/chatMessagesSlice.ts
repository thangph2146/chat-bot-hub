import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage } from '../types/chat';
import { apiClient } from '../apiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import logger from '../logger';
import { RootState } from './store';

interface ChatMessagesState {
  messagesBySession: Record<string, ChatMessage[]>;
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatMessagesState = {
  messagesBySession: {},
  isLoading: false,
  error: null,
};

export const fetchMessagesBySession = createAsyncThunk<ChatMessage[], string, { rejectValue: string }>(
  'chatMessages/fetchBySession',
  async (sessionId, { rejectWithValue }) => {
    logger.info('chatMessages', `Thunk: fetchMessagesBySession for session ${sessionId}`);
    try {
      const response = await apiClient.get<ChatMessage[]>(API_ENDPOINTS.CHAT_MESSAGES, { params: { sessionId } });
      logger.info('chatMessages', `Fetched ${response.data.length} messages for session ${sessionId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch messages';
      logger.error('chatMessages', `Thunk: fetchMessagesBySession failed for session ${sessionId}: ${errorMessage}`);
      return rejectWithValue(errorMessage);
    }
  }
);

const chatMessagesSlice = createSlice({
  name: 'chatMessages',
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<ChatMessage>) {
      const { sessionId } = action.payload;
      if (!state.messagesBySession[sessionId]) {
        state.messagesBySession[sessionId] = [];
      }
      state.messagesBySession[sessionId].push(action.payload);
    },
    removeMessage(state, action: PayloadAction<{ sessionId: string; messageId: number }>) {
      const { sessionId, messageId } = action.payload;
      if (state.messagesBySession[sessionId]) {
        state.messagesBySession[sessionId] = state.messagesBySession[sessionId].filter(m => m.id !== messageId);
      }
    },
    clearMessages(state, action: PayloadAction<string>) {
      delete state.messagesBySession[action.payload];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchMessagesBySession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessagesBySession.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.meta.arg) {
          state.messagesBySession[action.meta.arg] = action.payload;
        }
      })
      .addCase(fetchMessagesBySession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch messages';
      });
  },
});

export const { addMessage, removeMessage, clearMessages } = chatMessagesSlice.actions;
export default chatMessagesSlice.reducer;

export const selectMessagesBySession = (sessionId: string) => (state: RootState) => state.chatMessages.messagesBySession[sessionId] || [];
export const selectChatMessagesLoading = (state: RootState) => state.chatMessages.isLoading;
export const selectChatMessagesError = (state: RootState) => state.chatMessages.error;
