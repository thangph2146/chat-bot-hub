import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import {
  useQuery,
  useMutation,
  UseQueryResult,
  UseMutationResult,
  useQueryClient,
  // QueryClient, // Keep this commented or remove if not creating instance here
} from '@tanstack/react-query';
import { API_ENDPOINTS } from '../config/api.config';
import logger from './logger'; // Import the logger

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
  (error: AxiosError) => {
    logger.error('apiClient','Request Interceptor Error:', error.config?.method?.toUpperCase(), error.config?.url, error);
    return Promise.reject(error);
  }
);

// Optional: Add a response interceptor for global error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    logger.debug('apiClient','Response Interceptor:', response.config.method?.toUpperCase(), response.config.url, response.status, response.data);
    return response;
  },
  (error: AxiosError) => {
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
const fetchData = async <T>(url: string, params?: any): Promise<T> => {
  const log = apiClientLogger('fetchData');
  log.debug(`Fetching data from ${url} with params:`, params);
  try {
    const { data } = await apiClient.get<T>(url, { params });
    log.debug(`Successfully fetched data from ${url}:`, data);
    return data;
  } catch (error) {
    log.error(`Error fetching data from ${url}:`, error);
    throw error;
  }
};

// Generic mutator function for useMutation
const mutateData = async <T, R>(
  method: 'post' | 'put' | 'delete' | 'patch',
  url: string,
  payload?: T
): Promise<R> => {
  const log = apiClientLogger('mutateData');
  log.debug(`Mutating data (${method.toUpperCase()}) at ${url} with payload:`, payload);
  try {
    const { data } = await apiClient[method]<R>(url, payload);
    log.debug(`Successfully mutated data at ${url}:`, data);
    return data;
  } catch (error) {
    log.error(`Error mutating data at ${url}:`, error);
    throw error;
  }
};

// --- Auth Endpoints ---

// AUTH_LOGIN
export const useLogin = (): UseMutationResult<any, AxiosError, any, unknown> => {
  const qc = useQueryClient();
  const log = apiClientLogger('useLogin');
  return useMutation<any, AxiosError, any, unknown>({
    mutationFn: (credentials: any) => {
      log.info('Attempting login with credentials:', credentials); // Avoid logging sensitive data like passwords in production
      return mutateData('post', API_ENDPOINTS.AUTH_LOGIN, credentials);
    },
    onSuccess: (data: any) => {
      log.info('Login successful:', data);
      // Handle successful login, e.g., store token, redirect
      // qc.invalidateQueries({ queryKey: ['currentUser'] }); // Example: Use qc with correct syntax
    },
    onError: (error: AxiosError) => {
      log.error('Login failed:', error.response?.data || error.message);
    }
  });
};

// AUTH_REGISTER
export const useRegister = (): UseMutationResult<any, AxiosError, any, unknown> => {
  // const qc = useQueryClient(); // If needed for onSuccess/onError
  const log = apiClientLogger('useRegister');
  return useMutation<any, AxiosError, any, unknown>({
    mutationFn: (userData: any) => {
      log.info('Attempting registration with user data:', userData);
      return mutateData('post', API_ENDPOINTS.AUTH_REGISTER, userData);
    },
    onSuccess: (data: any) => {
      log.info('Registration successful:', data);
      // Handle successful registration
    },
    onError: (error: AxiosError) => {
      log.error('Registration failed:', error.response?.data || error.message);
    }
  });
};

// AUTH_GOOGLE_LOGIN
export const useGoogleLogin = (): UseMutationResult<{ redirectUrl: string }, AxiosError, void, unknown> => {
  const log = apiClientLogger('useGoogleLogin');
  return useMutation<{ redirectUrl: string }, AxiosError, void, unknown>({
    mutationFn: () => {
      log.info('Initiating Google login flow.');
      return apiClient.post(API_ENDPOINTS.AUTH_GOOGLE_LOGIN).then(res => res.data);
    },
    onSuccess: (data) => {
      log.info('Google login flow initiated successfully, redirect URL:', data.redirectUrl);
    },
    onError: (error: AxiosError) => {
      log.error('Google login flow initiation failed:', error.response?.data || error.message);
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
  token: string; // This is the application JWT
  expiresIn: number;
  // Add other user-related properties from your backend's response if needed
}

interface GoogleVerifyResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: GoogleVerifyResponseData; // The actual user and token data is nested here
}

export const useVerifyGoogleLogin = (): UseMutationResult<GoogleVerifyResponse, AxiosError, { idToken: string }, unknown> => {
  const qc = useQueryClient();
  const log = apiClientLogger('useVerifyGoogleLogin');
  return useMutation<GoogleVerifyResponse, AxiosError, { idToken: string }, unknown>({
    mutationFn: (params: { idToken: string }) => { // Changed params type to { idToken: string }
      log.info('Verifying Google login with idToken.'); // Updated log message
      return mutateData('post', API_ENDPOINTS.AUTH_GOOGLE_VERIFY, params); // params is now { idToken: "string" }
    },
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
    onError: (error: AxiosError) => {
      log.error('Google login verification failed:', error.response?.data || error.message);
    }
  });
};


// --- Chat Messages Endpoints ---

// Fetch chat messages for a session
export const useChatMessages = (sessionId: string | null | undefined): UseQueryResult<any[], AxiosError<unknown, any>> => {
  const log = apiClientLogger('useChatMessages');
  return useQuery<any[], AxiosError<unknown, any>, any[], (string | null | undefined)[]>({
    queryKey: ['chatMessages', sessionId],
    queryFn: async () => {
      log.info(`Fetching chat messages for session: ${sessionId}`);
      try {
        const data = await fetchData<any[]>(API_ENDPOINTS.CHAT_MESSAGES, { sessionId });
        log.info(`Successfully fetched ${data.length} messages for session: ${sessionId}`);
        return data;
      } catch (error) {
        const axiosError = error as AxiosError<unknown, any>;
        log.error(`Failed to fetch messages for session ${sessionId}:`, axiosError.response?.data || axiosError.message);
        throw error; // Re-throw to allow React Query to handle the error state
      }
    },
    enabled: !!sessionId, // Only run query if sessionId is available
    // onSuccess and onError removed from here
  });
};

// Send a chat message
export const useSendChatMessage = (sessionId: string): UseMutationResult<any, AxiosError, { message: string; [key: string]: any }, unknown> => {
  const qc = useQueryClient();
  const log = apiClientLogger('useSendChatMessage');
  return useMutation<any, AxiosError, { message: string; [key: string]: any }, unknown>({
    mutationFn: (payload: { message: string; [key: string]: any }) => {
      log.info(`Sending chat message to session ${sessionId}:`, payload.message);
      return mutateData('post', API_ENDPOINTS.CHAT_MESSAGES, { ...payload, sessionId });
    },
    onSuccess: (data: any, variables: { message: string; [key: string]: any }) => {
      log.info(`Chat message sent successfully to session ${sessionId}:`, data);
      qc.invalidateQueries({ queryKey: ['chatMessages', sessionId] });
      // Optimistic update example (optional):
      // qc.setQueryData(['chatMessages', sessionId], (oldQueryData: any[] | undefined) => {
      //   return oldQueryData ? [...oldQueryData, { ...data, ...variables, id: Date.now() }] : [{ ...data, ...variables, id: Date.now() }];
      // });
    },
    onError: (error: AxiosError, variables) => {
      log.error(`Failed to send chat message to session ${sessionId} (message: ${variables.message}):`, error.response?.data || error.message);
    }
  });
};

// --- Chat Sessions Endpoints ---

// Fetch all chat sessions
export const useChatSessions = (): UseQueryResult<any[], AxiosError<unknown, any>> => {
  const log = apiClientLogger('useChatSessions');
  return useQuery<any[], AxiosError<unknown, any>, any[], string[]>({
    queryKey: ['chatSessions'],
    queryFn: async () => {
      log.info('Fetching all chat sessions.');
      try {
        const data = await fetchData<any[]>(API_ENDPOINTS.SESSIONS);
        log.info(`Successfully fetched ${data.length} chat sessions.`);
        return data;
      } catch (error) {
        const axiosError = error as AxiosError<unknown, any>;
        log.error('Failed to fetch chat sessions:', axiosError.response?.data || axiosError.message);
        throw error; // Re-throw
      }
    },
    // onSuccess and onError removed from here
  });
};

// Create a new chat session
export const useCreateChatSession = (): UseMutationResult<any, AxiosError, any | undefined, unknown> => {
  const qc = useQueryClient();
  const log = apiClientLogger('useCreateChatSession');
  return useMutation<any, AxiosError, any | undefined, unknown>({
    mutationFn: (sessionData?: any) => {
      log.info('Creating new chat session with data:', sessionData);
      return mutateData('post', API_ENDPOINTS.SESSIONS, sessionData);
    },
    onSuccess: (data) => {
      log.info('Chat session created successfully:', data);
      qc.invalidateQueries({ queryKey: ['chatSessions'] });
      qc.invalidateQueries({ queryKey: ['chatSessionsByUser'] });
    },
    onError: (error: AxiosError) => {
      log.error('Failed to create chat session:', error.response?.data || error.message);
    }
  });
};

// Fetch chat sessions by user ID
export const useChatSessionsByUser = (userId: string | null | undefined): UseQueryResult<any[], AxiosError<unknown, any>> => {
  const endpoint = userId ? API_ENDPOINTS.SESSIONS_BY_USER(userId) : '';
  const log = apiClientLogger('useChatSessionsByUser');
  return useQuery<any[], AxiosError<unknown, any>, any[], (string | null | undefined)[]>({
    queryKey: ['chatSessionsByUser', userId],
    queryFn: async () => {
      log.info(`Fetching chat sessions for user: ${userId}`);
      try {
        const data = await fetchData<any[]>(endpoint);
        log.info(`Successfully fetched ${data.length} sessions for user: ${userId}`);
        return data;
      } catch (error) {
        const axiosError = error as AxiosError<unknown, any>;
        log.error(`Failed to fetch sessions for user ${userId}:`, axiosError.response?.data || axiosError.message);
        throw error; // Re-throw
      }
    },
    enabled: !!userId && !!endpoint, // Only run if userId and endpoint are available
    // onSuccess and onError removed from here
  });
};

export { apiClient };
