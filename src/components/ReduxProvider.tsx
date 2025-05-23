"use client";

import React, { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/store/store'; // Relies on correct path resolution
import { initializeAuth } from '@/lib/store/authSlice'; // Relies on correct path resolution
import { GoogleVerifyResponseData } from '@/lib/apiClient'; // Added missing import
import logger from '@/lib/logger';

const COMPONENT_NAME = "ReduxProvider";

// Helper function to safely parse JSON from localStorage
const safeJsonParse = <T,>(item: string | null): T | null => {
  if (!item) return null;
  try {
    return JSON.parse(item);
  } catch (error) {
    logger.error(COMPONENT_NAME, "Error parsing JSON from localStorage:", error);
    return null;
  }
};

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && typeof window !== 'undefined') {
      logger.info(COMPONENT_NAME, "Initializing auth state from localStorage.");
      const storedToken = localStorage.getItem('appToken');
      const storedUserInfo = safeJsonParse<GoogleVerifyResponseData>(localStorage.getItem('userInfo'));
      
      if (storedToken && storedUserInfo) {
        store.dispatch(initializeAuth({ token: storedToken, user: storedUserInfo }));
        logger.info(COMPONENT_NAME, "Auth state initialized from localStorage with token and user info.");
      } else if (storedToken) {
        logger.warn(COMPONENT_NAME, "Auth state initialized from localStorage with token ONLY. User info missing. Treating as unauthenticated for Redux.");
        store.dispatch(initializeAuth({ token: null, user: null }));
      } else {
        logger.info(COMPONENT_NAME, "No auth token or user info found in localStorage. Initializing as unauthenticated.");
        store.dispatch(initializeAuth({ token: null, user: null }));
      }
      initialized.current = true;
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
}