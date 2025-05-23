"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import logger from '@/lib/logger'; // Assuming logger is in src/lib
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store/store'; // Relies on correct path resolution
import { clearAuth } from '@/lib/store/authSlice'; // Relies on correct path resolution

const COMPONENT_NAME = "ChatBotPage";

export default function ChatBotPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, userInfo, isLoading: authIsLoading } = useSelector((state: RootState) => state.auth);
  
  // Use a local loading state to prevent flash of unauth content before Redux initializes
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    logger.info(COMPONENT_NAME, "Component mounted. Auth loading state:", authIsLoading, "IsAuthenticated:", isAuthenticated);

    // Wait for Redux auth state to potentially initialize from ReduxProvider
    if (!authIsLoading) {
      setIsPageLoading(false); // Redux state is now determined (either from localStorage or initial)
      if (!isAuthenticated) {
        logger.warn(COMPONENT_NAME, "User not authenticated, redirecting to home page.");
        router.push('/');
      } else {
        logger.info(COMPONENT_NAME, "User is authenticated. User:", userInfo?.username);
        // Proceed with loading chat bot functionalities
      }
    }

    return () => {
      logger.info(COMPONENT_NAME, "Component unmounted.");
    };
  }, [isAuthenticated, authIsLoading, router, userInfo]);

  const handleLogout = () => {
    logger.info(COMPONENT_NAME, "User logging out.");
    localStorage.removeItem('appToken');
    localStorage.removeItem('userInfo');
    dispatch(clearAuth());
    router.push('/');
  };

  if (isPageLoading || authIsLoading) {
    // Show a loading indicator while checking auth status or Redux is initializing
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-t-4 border-b-4 border-primary-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // This case should ideally be handled by the redirect in useEffect,
    // but it's a fallback to prevent rendering content if the redirect hasn't happened yet.
    // Or, if redirection is handled by middleware, this might not be strictly necessary.
    logger.debug(COMPONENT_NAME, "Render check: Not authenticated, returning null (should be redirected).");
    return null; 
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <header className="w-full bg-primary-700 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold">HUB Chat Bot</h1>
        {userInfo && (
          <div className="flex items-center gap-4">
            <span className="text-sm">Welcome, {userInfo.fullName || userInfo.username}!</span>
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </header>
      <main className="flex-grow container mx-auto p-4 w-full max-w-3xl">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Chat Interface</h2>
          <p className="text-gray-700">
            This is where the chat bot interaction will take place.
          </p>
          {/* Placeholder for chat components */}
          <div className="mt-6 border-t pt-6">
            <p className="text-sm text-gray-600">Chat messages and input will be here.</p>
            {/* Example: Displaying some user info from Redux store */}
            {userInfo && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs text-blue-700">User ID: {userInfo.userId}</p>
                <p className="text-xs text-blue-700">Email: {userInfo.email}</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="w-full text-center p-4 text-sm text-gray-600">
        © {new Date().getFullYear()} Trường Đại học Ngân hàng TP. Hồ Chí Minh
      </footer>
    </div>
  );
}
