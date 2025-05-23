export const API_ENDPOINTS = {
  AUTH_LOGIN: '/Users/login',
  AUTH_REGISTER: '/Users/register',
  AUTH_GOOGLE_LOGIN: '/Users/google-login',
  AUTH_GOOGLE_VERIFY: '/auth/google/verify',
  CHAT_MESSAGES: '/ChatMessages',
  GET_CHAT_MESSAGES_BY_ID: (id: string) => `/ChatMessages/${id}`, // This might be deprecated or used for other purposes now
  DELETE_CHAT_MESSAGE: (id: number) => `/ChatMessages/${id}`, // New endpoint for deleting messages
  GET_RECENT_CHAT_MESSAGES_BY_SESSION_ID: (sessionId: string, count: number = 5) => `/ChatMessages/session/${sessionId}/recent?count=${count}`,
  SESSIONS: '/ChatSessions',
  SESSIONS_BY_USER: (userId: string) => `/ChatSessions/user/${userId}`,
  DELETE_CHAT_SESSION: (id: string) => `/ChatSessions/${id}`, // Add endpoint for deleting a chat session
};

// The API_BASE_URL for your backend is configured in .env and handled server-side.
// This file defines the specific endpoint paths for that backend.

// --- Dify API Configuration ---
// The following Dify configurations are typically managed server-side
// and/or via environment variables for security and flexibility.

// DIFY_API_BASE_URL: The base URL for the Dify API.
// This should be configured in your .env file (e.g., NEXT_PUBLIC_DIFY_API_BASE_URL for Next.js if used client-side,
// or DIFY_API_BASE_URL if used server-side) and accessed appropriately by your application.
// Example: 'https://trolyai.hub.edu.vn' (Note: usually without '/v1' at the end,
// as the calling function or server-side proxy might append '/v1' or the specific API version path).
export const DIFY_API_BASE_URL: string = process.env.NEXT_PUBLIC_DIFY_API_BASE_URL || 'https://trolyai.hub.edu.vn'; // Replace with your actual env var or default

// DIFY_API_KEY: The API key for your Dify application.
// WARNING: This key is highly sensitive and MUST NOT be exposed on the client-side.
// It should be configured in your .env file (e.g., DIFY_API_KEY)
// and used exclusively on the server-side by your backend that proxies requests to Dify.
// This constant is NOT defined here to prevent accidental client-side exposure.
// Client-side code should make requests to your backend, which then securely uses this key.

// Dify API relative paths (to be appended to DIFY_API_BASE_URL, often with /v1/ by the server/proxy)
// Example: If DIFY_API_BASE_URL is 'https://trolyai.hub.edu.vn', a full Dify chat endpoint might be
// constructed on the server as `${process.env.DIFY_API_BASE_URL}/v1${DIFY_API_PATHS.CHAT_MESSAGES}`
export const DIFY_API_PATHS = {
  CHAT_MESSAGES: '/chat-messages', // This is a common endpoint path, often prefixed with /v1 on the server
  // Add other Dify specific relative paths if needed
};

// Interface for Dify Chat Payload Structure
export interface DifyChatPayload {
  inputs: Record<string, any>;    // Additional inputs if your Dify app requires them
  query: string;                  // The user's query
  user: string;                   // A unique identifier for the user
  response_mode: "streaming" | "blocking"; // "streaming" for partial responses, or "blocking"
  conversation_id?: string;       // (Optional) to continue an existing conversation
}

