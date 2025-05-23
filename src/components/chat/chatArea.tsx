"use client";

import React, { useEffect } from 'react';
import Message from './message';
import ChatInput from './chatInput';
import { NetworkStatus } from '@/components/ui/networkStatus';
import { useLogger } from '@/hooks/useLogger';

interface ChatMessage {
  id: number;
  sessionId: string;
  userId: number;
  senderName: string;
  isUser: boolean;
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  userId: number;
  title: string;
  createdAt: string;
  lastUpdatedAt: string;
  messages?: ChatMessage[];
}

interface ChatAreaProps {
  currentSessionId: string | null;
  setCurrentSessionId: (sessionId: string | null) => void;
  userSessions: ChatSession[] | undefined;
  messages: ChatMessage[];
  isSending: boolean;
  recentMessagesLoading: boolean;
  recentMessagesError: any;
  isRefetchingMessages: boolean;
  refetchMessages: () => void;
  isDeletingMessage: number | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleDeleteMessageClick: (messageId: number) => void;
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
}

function ChatArea({
  currentSessionId,
  setCurrentSessionId,
  userSessions,
  messages,
  isSending,
  recentMessagesLoading,
  recentMessagesError,
  isRefetchingMessages,
  refetchMessages,
  isDeletingMessage,
  messagesEndRef,
  handleDeleteMessageClick,
  newMessage,
  setNewMessage,
  handleSendMessage,
  handleKeyPress
}: ChatAreaProps) {
  const logger = useLogger();

  // Handle the case when trying to fetch messages for a non-existent session
  useEffect(() => {
    if (recentMessagesError && currentSessionId) {
      // Check if the error is likely due to a deleted session (500 error or Network Error)
      const isSessionError = 
        recentMessagesError.response?.status === 500 || 
        recentMessagesError.message === 'Network Error';
        
      if (isSessionError) {
        logger.error('ChatArea', `Error fetching messages for session ${currentSessionId}. The session might have been deleted.`);
        
        // Check if the current session still exists in userSessions
        if (userSessions && !userSessions.find(s => s.id === currentSessionId)) {
          logger.info('ChatArea', `Session ID ${currentSessionId} not found in user sessions. Clearing current session.`);
          
          // Clear current session
          setCurrentSessionId(null);
          
          // If there are other sessions available, switch to the first one
          if (userSessions.length > 0) {
            logger.info('ChatArea', `Switching to session: ${userSessions[0].id}`);
            setTimeout(() => setCurrentSessionId(userSessions[0].id), 100);
          }
        }
      }
    }
  }, [recentMessagesError, currentSessionId, userSessions, logger, setCurrentSessionId]);

  return (
    <div className="flex-grow flex flex-col bg-secondary-100/60 backdrop-blur-sm rounded-lg md:m-3 md:ml-0 shadow-xl">
      {currentSessionId ? (
        <>
          {/* Chat Header - sticky on mobile for better UX */}
          <div className="p-3 sm:p-4 bg-gradient-to-r from-primary-100 to-primary-200 rounded-t-none md:rounded-t-lg border-b border-primary-200 flex justify-between items-center sticky top-0 z-20">
            <h2 className="font-semibold text-base sm:text-lg text-primary-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              <span className="truncate max-w-[180px] sm:max-w-xs md:max-w-sm">
                {userSessions?.find(s => s.id === currentSessionId)?.title || "Chat Session"}
              </span>
            </h2>
            <span className="text-[10px] sm:text-xs px-2 py-1 bg-accent-100 rounded-full text-accent-800 font-mono">
              ID: {currentSessionId.substring(0, 8)}...
            </span>
          </div>
          
          {/* Chat Messages - improved scrolling */}
          <div className="flex-grow overflow-y-auto p-3 sm:p-6 bg-gradient-to-br from-secondary-50/70 to-secondary-100/70 custom-scrollbar">
            {/* Network Status Message */}
            <NetworkStatus 
              error={recentMessagesError} 
              refetch={refetchMessages}
              isRefetching={isRefetchingMessages}
            />
            
            {recentMessagesLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 border-t-4 border-b-4 border-primary-700 rounded-full animate-spin"></div>
                <p className="ml-3 text-sm sm:text-base text-primary-700 font-medium">Đang tải tin nhắn...</p>
              </div>
            ) : messages && messages.length > 0 ? (
              <div className="space-y-4 sm:space-y-6 pb-4">
                {messages.map((msg: ChatMessage) => (
                  <Message
                    key={msg.id}
                    message={msg}
                    isDeletingMessage={isDeletingMessage}
                    handleDeleteMessageClick={handleDeleteMessageClick}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-primary-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-primary-700 font-medium text-base sm:text-lg">Cuộc trò chuyện mới</p>
                <p className="text-primary-500 text-sm mt-2 text-center">Bắt đầu cuộc trò chuyện của bạn ngay bây giờ</p>
              </div>
            )}

            {/* Add typing indicator when needed */}
            {isSending && (
              <div className="flex items-center p-3 mt-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center mr-2">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
                <div className="text-xs text-primary-500">Bot đang gõ...</div>
              </div>
            )}
          </div>
          
          {/* Chat Input - improved mobile experience */}
          <ChatInput 
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
            handleKeyPress={handleKeyPress}
            isSending={isSending}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-primary-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-primary-700 font-medium text-base sm:text-lg">Cuộc trò chuyện mới</p>
          <p className="text-primary-500 text-sm mt-2 text-center">Bắt đầu cuộc trò chuyện của bạn ngay bây giờ</p>
        </div>
      )}

      {/* Add floating new chat button for mobile */}
      <div className="md:hidden fixed bottom-20 right-4 z-10">
        <button
          className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-600 to-primary-800 text-white shadow-lg flex items-center justify-center"
          aria-label="Create new chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ChatArea;
