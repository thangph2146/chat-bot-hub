import { API_ENDPOINTS, DIFY_API_BASE_URL, DIFY_API_PATHS, type DifyChatPayload } from '../config/api.config';
import axios, { AxiosError as AxiosErrorType, AxiosResponse as AxiosResponseType, InternalAxiosRequestConfig, AxiosInstance } from 'axios';
import {
  useQuery,
  useMutation,
  UseQueryResult,
  UseMutationResult,
  useQueryClient,
  // QueryClient, // Keep this commented or remove if not creating instance here
} from '@tanstack/react-query';
import logger from './logger'; // Import the logger
import { ChatSession } from './types/chat'; // Corrected import path

const apiClientLogger = (componentName: string) => ({
  debug: (...args: any[]) => logger.debug(`apiClient.${componentName}`, ...args),
  info: (...args: any[]) => logger.info(`apiClient.${componentName}`, ...args),
  warn: (...args: any[]) => logger.warn(`apiClient.${componentName}`, ...args),
  error: (...args: any[]) => logger.error(`apiClient.${componentName}`, ...args),
});

// Create an Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, // Use the environment variable
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add a request interceptor for things like adding auth tokens
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => { // Changed AxiosRequestConfig to InternalAxiosRequestConfig
    const token = localStorage.getItem('appToken'); // Use 'appToken' as stored in page.tsx
    if (token) { // config.headers is guaranteed to exist on InternalAxiosRequestConfig
      config.headers.Authorization = `Bearer ${token}`;
      logger.debug('apiClient', 'Request Interceptor: Token added to Authorization header.');
    } else {
      logger.debug('apiClient', 'Request Interceptor: No token found, proceeding without Authorization header.');
    }
    logger.debug('apiClient', 'Request Interceptor:', config.method?.toUpperCase(), config.url, config.params, config.data);
    return config;
  },
  (error: AxiosErrorType) => {
    logger.error('apiClient','Request Interceptor Error:', error.config?.method?.toUpperCase(), error.config?.url, error);
    return Promise.reject(error);
  }
);

// Optional: Add a response interceptor for global error handling
apiClient.interceptors.response.use(
  (response: AxiosResponseType) => {
    logger.debug('apiClient','Response Interceptor:', response.config.method?.toUpperCase(), response.config.url, response.status, response.data);
    return response;
  },
  (error: AxiosErrorType) => {
    logger.error(
        'apiClient',
        'Response Interceptor Error:', 
        error.config?.method?.toUpperCase(), 
        error.config?.url, 
        error.response?.status, 
        error.response?.data,
        error
    );
    // Handle global errors, e.g., redirect on 401
    if (error.response?.status === 401) {
      logger.warn('apiClient', 'Unauthorized (401) error detected. User session might be invalid or expired.');
      // For example, clear token and redirect to login page
      localStorage.removeItem('appToken');
      localStorage.removeItem('userInfo'); // Also clear userInfo if stored
      logger.info('apiClient', 'App token and userInfo cleared from localStorage due to 401 error.');
      // Ideally, dispatch an action to clear Redux auth state here.
      // This is hard because apiClient is not a React component.
      // The UI will reflect unauthenticated state on next check or refresh.
      
      // Check if running in a browser environment before using window.location
      if (typeof window !== 'undefined') {
        // To prevent redirect loops if the login page itself causes a 401,
        // or if the request was for a public resource that incorrectly returned 401.
        // Adjust '/login' to your actual login page path if different.
        const loginPath = '/login'; 
        if (window.location.pathname !== loginPath) {
          logger.info('apiClient', `Redirecting to ${loginPath} due to 401 error.`);
          window.location.href = loginPath;
        } else {
          logger.warn('apiClient', `Already on ${loginPath} or 401 on public resource, not redirecting.`);
        }
      }
    }
    return Promise.reject(error);
  }
);

// --- API Client Functions and Hooks ---

// Generic fetcher function for useQuery
// Update the fetchData function to handle network errors better
const fetchData = async <T>(url: string, params?: any): Promise<T> => {
  const log = apiClientLogger('fetchData');
  log.debug(`Fetching data from ${url} with params:`, params);
  
  // Add retry logic for network errors
  const MAX_RETRIES = 2;
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      const response = await apiClient.get<T>(url, { params });
      log.info(`Successfully fetched data from ${url}. Status: ${response.status}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosErrorType<unknown, any>;
      
      // Check if it's a network error
      const isNetworkError = axiosError.message === 'Network Error';
      
      if (isNetworkError && retries < MAX_RETRIES) {
        // If it's a network error and we can retry, increment retries and wait
        retries++;
        const delay = Math.pow(2, retries) * 1000; // Exponential backoff
        log.warn(`Network error fetching data from ${url}. Retrying (${retries}/${MAX_RETRIES}) in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If we reached max retries or it's not a network error, log and throw
      log.error(`Failed to fetch data from ${url}. Status: ${axiosError.response?.status}`, 
                axiosError.message, axiosError.response?.data);
      throw axiosError;
    }
  }

  // This should never be reached due to the throw in the catch block
  throw new Error(`Failed to fetch data from ${url} after ${MAX_RETRIES} retries`);
};

// Generic mutator function for useMutation
const mutateData = async <R, T = any>( // Swapped R and T, T is payload, R is response. Made T optional.
  method: 'post' | 'put' | 'delete' | 'patch',
  url: string,
  payload?: T
): Promise<R> => {
  const log = apiClientLogger('mutateData');
  log.debug(`Mutating data (${method.toUpperCase()}) at ${url} with payload:`, payload);
  try {
    const response = await apiClient[method]<R>(url, payload);
    log.info(`Successfully mutated data at ${url}. Status: ${response.status}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosErrorType<unknown, any>; 
    log.error(`Error mutating data at ${url}. Status: ${axiosError.response?.status}`, axiosError.message, axiosError.response?.data);
    throw axiosError; // Re-throw to be handled by React Query
  }
};

// --- Auth Endpoints ---

// AUTH_LOGIN
export const useLogin = (): UseMutationResult<any, AxiosErrorType, any, unknown> => {
  const qc = useQueryClient();
  const log = apiClientLogger('useLogin');
  return useMutation<any, AxiosErrorType, any, unknown>({
    mutationFn: (credentials: any) => mutateData<any, any>('post', API_ENDPOINTS.AUTH_LOGIN, credentials),
    onSuccess: (data: any) => {
      log.info('Login successful:', data);
      // Handle successful login, e.g., store token, redirect
      // qc.invalidateQueries({ queryKey: ['currentUser'] }); // Example: Use qc with correct syntax
    },
    onError: (error: AxiosErrorType) => {
      log.error('Login failed:', error.message, error.response?.data);
      // Potentially dispatch an action to update auth state with error
    }
  });
};

// AUTH_REGISTER
export const useRegister = (): UseMutationResult<any, AxiosErrorType, any, unknown> => {
  // const qc = useQueryClient(); // If needed for onSuccess/onError
  const log = apiClientLogger('useRegister');
  return useMutation<any, AxiosErrorType, any, unknown>({
    mutationFn: (userData: any) => mutateData<any, any>('post', API_ENDPOINTS.AUTH_REGISTER, userData),
    onSuccess: (data: any) => {
      log.info('Registration successful:', data);
      // Handle successful registration, e.g., redirect to login or auto-login
    },
    onError: (error: AxiosErrorType) => {
      log.error('Registration failed:', error.message, error.response?.data);
    }
  });
};

// AUTH_GOOGLE_LOGIN
export const useGoogleLogin = (): UseMutationResult<{ redirectUrl: string }, AxiosErrorType, void, unknown> => {
  const log = apiClientLogger('useGoogleLogin');
  return useMutation<{ redirectUrl: string }, AxiosErrorType, void, unknown>({
    mutationFn: () => fetchData<{ redirectUrl: string }>(API_ENDPOINTS.AUTH_GOOGLE_LOGIN),
    onSuccess: (data) => {
      log.info('Google login initiated, redirecting to:', data.redirectUrl);
      // Typically, you'd redirect the user to data.redirectUrl here
    },
    onError: (error: AxiosErrorType) => {
      log.error('Google login initiation failed:', error.message, error.response?.data);
    }
  });
};


// AUTH_GOOGLE_VERIFY
// Define expected response structure for Google verify
// Export this type so it can be used in Redux slices
export interface GoogleVerifyResponseData {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  token: string;
  expiresIn: number; // Corrected: removed extra space, ensured it's part of the interface
  // Add other user-related properties from your backend's response if needed
}

interface GoogleVerifyResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: GoogleVerifyResponseData;
}

export const useVerifyGoogleLogin = (): UseMutationResult<GoogleVerifyResponse, AxiosErrorType, { idToken: string }, unknown> => {
  const qc = useQueryClient();
  const log = apiClientLogger('useVerifyGoogleLogin');
  return useMutation<GoogleVerifyResponse, AxiosErrorType, { idToken: string }, unknown>({
    mutationFn: (params: { idToken: string }) => 
      mutateData<GoogleVerifyResponse, { idToken: string }>('post', API_ENDPOINTS.AUTH_GOOGLE_VERIFY, params),
    onSuccess: (data: GoogleVerifyResponse) => {
      log.info('Google login verification successful:', data);
      // Handle successful Google login verification
      // The actual token storage and redirection will be handled in the component
      // For now, just invalidate queries that might depend on user authentication state
      qc.invalidateQueries({ queryKey: ['currentUser'] }); // Example: if you have a query for the current user
      qc.invalidateQueries({ queryKey: ['chatSessions'] }); // May need to refetch sessions if they are user-specific
      qc.invalidateQueries({ queryKey: ['chatSessionsByUser'] });
      // The component will use `data.token` and `data.user`
    },
    onError: (error: AxiosErrorType) => {
      log.error('Google login verification failed:', error.message, error.response?.data);
    }
  });
};


// --- Chat Messages Endpoints ---

// Fetch chat messages for a session
export const useChatMessages = (sessionId: string | null | undefined): UseQueryResult<any[], AxiosErrorType<unknown, any>> => {
  const log = apiClientLogger('useChatMessages');
  return useQuery<any[], AxiosErrorType<unknown, any>, any[], (string | null | undefined)[]>({
    queryKey: ['chatMessages', sessionId],
    queryFn: async () => {
      log.info(`Fetching chat messages for session: ${sessionId}`);
      try {
        const data = await fetchData<any[]>(API_ENDPOINTS.CHAT_MESSAGES, { sessionId });
        log.info(`Successfully fetched ${data.length} messages for session: ${sessionId}`);
        return data;
      } catch (error) {
        const axiosError = error as AxiosErrorType<unknown, any>;
        log.error(`Failed to fetch messages for session ${sessionId}:`, axiosError.response?.data || axiosError.message);
        throw error; // Re-throw to allow React Query to handle the error state
      }
    },
    enabled: !!sessionId, // Only run query if sessionId is available
  });
};

// New Hook: Fetch all chat messages by a specific ID (e.g., conversationId or a general message ID)
// Modified: This hook will now fetch messages for a given ID, treating it as a session ID
// and using a query parameter, similar to useChatMessages.
export const useGetChatMessagesById = (id: string | null | undefined): UseQueryResult<any[], AxiosErrorType<unknown, any>> => {
  const log = apiClientLogger('useGetChatMessagesById');
  // Use the base CHAT_MESSAGES endpoint, as the path parameter version seems problematic.
  const endpoint = API_ENDPOINTS.CHAT_MESSAGES; // Using the general /ChatMessages endpoint
  return useQuery<any[], AxiosErrorType<unknown, any>, any[], (string | null | undefined)[]>({
    queryKey: ['chatMessagesById', id], // Unique query key including the ID
    queryFn: async () => {
      if (!id) {
        log.warn('Attempted to fetch messages by ID without a valid ID provided.');
        return []; // Or throw an error
      }
      // Log indicates fetching for a session ID using a query parameter.
      log.info(`Fetching chat messages for session ID (using query param): ${id} from endpoint: ${endpoint}`);
      try {
        // Pass the 'id' as 'sessionId' query parameter.
        // This aligns with how `useChatMessages` works and the usage in `page.tsx`.
        const data = await fetchData<any[]>(endpoint, { sessionId: id });
        log.info(`Successfully fetched ${data.length} messages for session ID: ${id}`);
        return data;
      } catch (error) {
        const axiosError = error as AxiosErrorType<unknown, any>;
        // Updated error log message
        log.error(`Failed to fetch messages for session ID ${id} (using query param):`, axiosError.response?.data || axiosError.message);
        throw error; // Re-throw to allow React Query to handle the error state
      }
    },
    enabled: !!id && !!endpoint, // Query is enabled if id and endpoint are truthy
  });
};

// Update useGetRecentChatMessagesBySessionId to better handle deleted sessions
export const useGetRecentChatMessagesBySessionId = (
  sessionId: string | null | undefined,
  count: number = 5
): UseQueryResult<any[], AxiosErrorType<unknown, any>> => {
  const log = apiClientLogger('useGetRecentChatMessagesBySessionId');
  const qc = useQueryClient(); // Ensure queryClient is available

  const endpoint = sessionId ? API_ENDPOINTS.GET_RECENT_CHAT_MESSAGES_BY_SESSION_ID(sessionId, count) : '';
  
  // Check if the session ID exists in the current list of sessions from the cache
  const sessionExists = !!sessionId && (qc.getQueryData<any[]>(['chatSessionsByUser'])?.some(s => s.id === sessionId) ?? false);

  return useQuery<any[], AxiosErrorType<unknown, any>, any[], (string | null | undefined | number | boolean)[]>({ // Added boolean for sessionExists
    queryKey: ['recentChatMessages', sessionId, count, sessionExists], // Add sessionExists to queryKey to refetch if it changes
    queryFn: async () => {
      if (!sessionId || !endpoint) {
        log.warn('Attempted to fetch recent messages without a valid session ID or endpoint.');
        return [];
      }
      
      // This check is still good as a secondary defense within queryFn
      const sessions = qc.getQueryData<any[]>(['chatSessionsByUser']);
      if (sessions && !sessions.some(s => s.id === sessionId)) {
        log.warn(`Session ID ${sessionId} not found in cached sessions (checked inside queryFn). Likely deleted.`);
        return []; 
      }
      
      try {
        log.info(`Fetching recent chat messages for session ID: ${sessionId}, count: ${count} from endpoint: ${endpoint}`);
        const data = await fetchData<any[]>(endpoint);
        log.info(`Successfully fetched ${data.length} recent messages for session ID: ${sessionId}`);
        return data;
      } catch (error) {
        const axiosError = error as AxiosErrorType<unknown, any>;
        
        // If we get a 500 error, the session might have been deleted
        if (axiosError.response?.status === 500 || axiosError.message === 'Network Error') {
          log.warn(`Error fetching messages for session ID ${sessionId}. Session might have been deleted.`);
          
          // Invalidate the sessions query to refetch the latest sessions list
          qc.invalidateQueries({ queryKey: ['chatSessionsByUser'] });
          
          // Return empty array instead of throwing to prevent UI errors
          return [];
        }
        
        log.error(`Failed to fetch recent messages for session ID ${sessionId}:`, 
                axiosError.response?.status, axiosError.response?.data || axiosError.message);
        throw axiosError;
      }
    },
    enabled: !!sessionId && !!endpoint && sessionExists, // Crucially, ensure sessionExists is true
    retry: (failureCount, error) => {
      // Don't retry if we get a 500 error (likely deleted session)
      if (error.response?.status === 500) return false;
      // Don't retry if the session might be deleted
      if (error.message === 'Network Error' && failureCount > 0) return false;
      return failureCount < 2;  // Only retry other errors up to 2 times
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff with max delay of 30s
  });
};


// Send a chat message
export const useSendChatMessage = (sessionId: string): UseMutationResult<any, AxiosErrorType, { message: string; [key: string]: any }, unknown> => {
  const qc = useQueryClient();
  const log = apiClientLogger('useSendChatMessage');
  return useMutation<any, AxiosErrorType, { message: string; [key: string]: any }, unknown>({
    mutationFn: (payload: { message: string; [key: string]: any }) => {
      // Construct the payload for the POST request
      // Ensure it matches what your backend /ChatMessages endpoint expects
      const messageData = {
        sessionId: sessionId, // Include the session ID
        userId: payload.userId, // Assuming userId is passed in payload
        senderName: payload.senderName, // Assuming senderName is passed
        isUser: payload.isUser, // Assuming isUser is passed
        content: payload.message, // The actual message content
        // timestamp will likely be set by the backend
      };
      log.info(`Sending chat message to session ${sessionId}:`, messageData.content);
      return mutateData<any, typeof messageData>('post', API_ENDPOINTS.CHAT_MESSAGES, messageData);
    },
    onSuccess: (data: any, variables: { message: string; [key: string]: any }) => {
      log.info('Chat message sent successfully to session', sessionId, 'Data:', data);
      // Invalidate queries related to chat messages for this session to refetch
      qc.invalidateQueries({ queryKey: ['chatMessages', sessionId] });
      qc.invalidateQueries({ queryKey: ['chatMessagesById', sessionId] }); // Also invalidate by ID if it's the same session
      qc.invalidateQueries({ queryKey: ['chatSessionsByUser'] }); // To update lastUpdatedAt on session list
    },
    onError: (error: AxiosErrorType, variables) => {
      log.error('Error sending chat message to session', sessionId, ':', error.message, error.response?.data, 'Variables:', variables);
    }
  });
};

// --- Chat Sessions Endpoints ---

// Fetch all chat sessions
export const useChatSessions = (): UseQueryResult<any[], AxiosErrorType<unknown, any>> => {
  const log = apiClientLogger('useChatSessions');
  return useQuery<any[], AxiosErrorType<unknown, any>, any[], string[]>({
    queryKey: ['chatSessions'],
    queryFn: async () => {
      log.info('Fetching all chat sessions.');
      try {
        const data = await fetchData<any[]>(API_ENDPOINTS.SESSIONS);
        log.info(`Successfully fetched ${data.length} chat sessions.`);
        return data;
      } catch (error) {
        const axiosError = error as AxiosErrorType<unknown, any>;
        log.error('Failed to fetch chat sessions:', axiosError.response?.data || axiosError.message);
        throw error; // Re-throw
      }
    },
  });
};

// Define the payload for creating a chat session
interface CreateChatSessionPayload {
  userId: number; // Assuming userId is always required
  title?: string; // Title is optional
}

// Create a new chat session
export const useCreateChatSession = (): UseMutationResult<ChatSession, AxiosErrorType, CreateChatSessionPayload, unknown> => {
  const qc = useQueryClient();
  const log = apiClientLogger('useCreateChatSession');
  return useMutation<ChatSession, AxiosErrorType, CreateChatSessionPayload, unknown>({
    mutationFn: (sessionData: CreateChatSessionPayload) => {
      log.info('Creating new chat session with data:', sessionData);
      // Ensure mutateData is correctly typed for request (CreateChatSessionPayload) and response (ChatSession)
      return mutateData<ChatSession, CreateChatSessionPayload>('post', API_ENDPOINTS.SESSIONS, sessionData);
    },
    onSuccess: (data: ChatSession) => { // Response data is now typed as ChatSession
      log.info('Chat session created successfully:', data);
      qc.invalidateQueries({ queryKey: ['chatSessions'] });
      // More precise invalidation for chatSessionsByUser using the userId from the response
      if (data && data.userId) {
        qc.invalidateQueries({ queryKey: ['chatSessionsByUser', data.userId.toString()] });
      } else {
        // Fallback if userId is not in the response, though it should be
        qc.invalidateQueries({ queryKey: ['chatSessionsByUser'] });
      }
    },
    onError: (error: AxiosErrorType) => {
      log.error('Error creating chat session:', error.message, error.response?.data);
    }
  });
};

// Fetch chat sessions by user ID
export const useChatSessionsByUser = (userId: string | null | undefined): UseQueryResult<any[], AxiosErrorType<unknown, any>> => {
  const endpoint = userId ? API_ENDPOINTS.SESSIONS_BY_USER(userId) : '';
  const log = apiClientLogger('useChatSessionsByUser');
  return useQuery<any[], AxiosErrorType<unknown, any>, any[], (string | null | undefined)[]>({
    queryKey: ['chatSessionsByUser', userId],
    queryFn: async () => {
      if (!endpoint) {
        log.warn('User ID or endpoint is not available, skipping fetch for useChatSessionsByUser.');
        return Promise.resolve([]); // Or throw an error, depending on desired behavior
      }
      log.info(`Fetching chat sessions for user from ${endpoint}`);
      const response = await apiClient.get<any[]>(endpoint);
      return response.data;
    },
    enabled: !!userId && !!endpoint,
  });
};

// --- Dify API Endpoint ---

interface SendDirectToDifyParams {
  payload: DifyChatPayload;
  // IMPORTANT: Passing an API key directly from the client-side is a significant security risk.
  // This key should ideally be handled by a backend proxy which securely stores and uses the key.
  // If you must use it client-side (e.g., for testing with a non-production key from NEXT_PUBLIC_DIFY_API_KEY),
  // understand the risks involved.
  apiKey: string;
}

/**
 * Hook to send a message directly to the Dify API.
 * Constructs the URL from DIFY_API_BASE_URL and DIFY_API_PATHS.CHAT_MESSAGES,
 * assuming a /v1 prefix for the Dify API.
 * @returns {UseMutationResult<AxiosResponseType<any>, AxiosErrorType, SendDirectToDifyParams, unknown>}
 */
export const useSendDirectToDify = (): UseMutationResult<AxiosResponseType<any>, AxiosErrorType, SendDirectToDifyParams, unknown> => {
  const log = apiClientLogger('useSendDirectToDify');
  
  return useMutation<AxiosResponseType<any>, AxiosErrorType, SendDirectToDifyParams, unknown>({
    mutationFn: async ({ payload, apiKey }: SendDirectToDifyParams) => {
      // Assuming Dify API endpoints are typically prefixed with /v1
      // e.g., https://api.dify.ai/v1/chat-messages
      const difyUrl = `${DIFY_API_BASE_URL}/v1${DIFY_API_PATHS.CHAT_MESSAGES}`; 
      
      log.info(`Attempting to send message directly to Dify: ${difyUrl}`);
      log.debug('Dify payload:', JSON.stringify(payload, null, 2));

      if (!apiKey) {
        const errorMsg = 'Dify API Key is missing. Cannot make an authenticated call to Dify.';
        log.error(errorMsg);
        // Throw an error that React Query can catch
        throw new AxiosErrorType(errorMsg, 'NO_API_KEY');
      }

      try {
        const response = await axios.post(difyUrl, payload, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        log.info('Successfully sent message to Dify.');
        log.debug('Dify response status:', response.status);
        log.debug('Dify response data:', response.data);
        return response;
      } catch (error) {
        const axiosError = error as AxiosErrorType;
        if (axiosError.isAxiosError) {
          log.error('Axios error sending message to Dify:', 
            axiosError.response?.status, 
            axiosError.response?.data, 
            axiosError.message,
            `Request URL: ${axiosError.config?.url}`
          );
        } else {
          log.error('Generic error sending message to Dify:', error);
        }
        throw axiosError; // Re-throw to be caught by onError and for the caller
      }
    },
    onSuccess: (data: AxiosResponseType<any>, variables: SendDirectToDifyParams) => {
      log.info('useSendDirectToDify onSuccess. Response status:', data.status);
      log.debug('Data received from Dify:', data.data);
      // You might want to invalidate or update other queries here
    },
    onError: (error: AxiosErrorType, variables: SendDirectToDifyParams) => {
      log.error('useSendDirectToDify onError. Error message:', error.message);
      if (error.response) {
        log.error('Error response data from Dify:', error.response.data);
        log.error('Error response status from Dify:', error.response.status);
      }
      // Handle specific errors or side effects
    }
  });
};

// Delete a chat message by ID
export const useDeleteChatMessage = (): UseMutationResult<any, AxiosErrorType, { messageId: number; sessionId: string }, unknown> => {
  const qc = useQueryClient();
  const log = apiClientLogger('useDeleteChatMessage');
  return useMutation<any, AxiosErrorType, { messageId: number; sessionId: string }, unknown>({
    mutationFn: ({ messageId }) => {
      log.info(`Deleting chat message with ID: ${messageId}`);
      const endpoint = API_ENDPOINTS.DELETE_CHAT_MESSAGE(messageId);
      return mutateData<any, void>('delete', endpoint);
    },
    onSuccess: (data, { messageId, sessionId }) => {
      log.info(`Chat message with ID ${messageId} deleted successfully`);
      // Invalidate relevant queries to refresh data
      qc.invalidateQueries({ queryKey: ['chatMessages', sessionId] });
      qc.invalidateQueries({ queryKey: ['chatMessagesById', sessionId] });
      qc.invalidateQueries({ queryKey: ['recentChatMessages', sessionId] });
    },
    onError: (error: AxiosErrorType, { messageId, sessionId }) => {
      log.error(`Error deleting chat message with ID ${messageId} from session ${sessionId}:`, error.message, error.response?.data);
    }
  });
};

// Delete a chat session by ID
export const useDeleteChatSession = (userIdToDeleteFor: string | null | undefined): UseMutationResult<any, AxiosErrorType, string, unknown> => {
  const qc = useQueryClient();
  const log = apiClientLogger('useDeleteChatSession');
  return useMutation<any, AxiosErrorType, string, unknown>({
    mutationFn: (sessionId: string) => {
      log.info(`Deleting chat session with ID: ${sessionId}`);
      const endpoint = API_ENDPOINTS.DELETE_CHAT_SESSION(sessionId);
      return mutateData<any, void>('delete', endpoint);
    },
    onSuccess: (data, deletedSessionId) => { // deletedSessionId is the variable passed to mutateFn
      log.info(`Chat session with ID ${deletedSessionId} deleted successfully`);
      
      // Remove specific message queries for the deleted session
      qc.removeQueries({ queryKey: ['chatMessages', deletedSessionId], exact: true });
      qc.removeQueries({ queryKey: ['chatMessagesById', deletedSessionId], exact: true });
      // Remove all recent message queries for this session (prefix match)
      qc.removeQueries({ queryKey: ['recentChatMessages', deletedSessionId] }); 

      // Optimistically update the session list for the specific user
      if (userIdToDeleteFor) {
        qc.setQueryData(['chatSessionsByUser', userIdToDeleteFor], (oldData: any[] | undefined) => {
          log.debug(`Optimistically updating chatSessionsByUser for user ${userIdToDeleteFor}. Old data length: ${oldData?.length}`);
          const newData = oldData ? oldData.filter(s => s.id !== deletedSessionId) : [];
          log.debug(`New data length for chatSessionsByUser for user ${userIdToDeleteFor}: ${newData.length}`);
          return newData;
        });
      }
      
      // Still invalidate to ensure consistency with the backend and for other listeners
      // This will also handle cases where userIdToDeleteFor might be null or the optimistic update isn't sufficient
      qc.invalidateQueries({ queryKey: ['chatSessionsByUser', userIdToDeleteFor] });
      qc.invalidateQueries({ queryKey: ['chatSessions'] }); // General session list if used elsewhere
    },
    onError: (error: AxiosErrorType, sessionId) => {
      log.error(`Error deleting chat session with ID ${sessionId}:`, error.message, error.response?.data);
    }
  });
};

export { apiClient };
