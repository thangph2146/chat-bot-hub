"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import logger from '@/lib/logger';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store/store';
import { clearAuth } from '@/lib/store/authSlice';
import { 
  useChatSessionsByUser, 
  useGetRecentChatMessagesBySessionId,
  useDeleteChatMessage,
  useDeleteChatSession,
  useCreateChatSession // Added import for useCreateChatSession
} from '@/lib/apiClient';

// Import the components
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MainLayout from '@/components/layout/main';
import ChatArea from '@/components/chat/chatArea';
import { DeleteMessageDialog, DeleteSessionDialog } from '@/components/chat/dialogComponents';

// Define interfaces for type safety
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

const COMPONENT_NAME = "ChatBotPage";

export default function ChatBotPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, userInfo, isLoading: authIsLoading } = useSelector((state: RootState) => state.auth);
  
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState(false); // For mobile sidebar toggle
  const [isDeletingMessage, setIsDeletingMessage] = useState<number | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null); // Track message pending deletion confirmation
  const [activeMenu, setActiveMenu] = useState<number | null>(null); // Track which message has an open menu
  const [isDeletingSession, setIsDeletingSession] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [activeSessionMenu, setActiveSessionMenu] = useState<string | null>(null); // Add state for session menu
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null); // Reference for the context menu

  // Fetch sessions for the current user
  const { data: userSessions, isLoading: sessionsLoading } = useChatSessionsByUser(userInfo?.userId?.toString());
  const { 
    data: recentMessages, 
    isLoading: recentMessagesLoading, 
    error: recentMessagesError, 
    refetch: refetchRecentMessages,
    isRefetching: isRefetchingMessages
  } = useGetRecentChatMessagesBySessionId(currentSessionId, 10); // Fetch 10 recent messages
  const deleteMessage = useDeleteChatMessage(); // Initialize the delete message hook
  const deleteSession = useDeleteChatSession(userInfo?.userId?.toString());
  const createSession = useCreateChatSession(); // Initialize the create session hook

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    logger.info(COMPONENT_NAME, "Component mounted. Auth loading state:", authIsLoading, "IsAuthenticated:", isAuthenticated);

    if (!authIsLoading) {
      setIsPageLoading(false);
      if (!isAuthenticated) {
        logger.warn(COMPONENT_NAME, "User not authenticated, redirecting to home page.");
        router.push('/');
      } else {
        logger.info(COMPONENT_NAME, "User is authenticated. User:", userInfo?.username);
        // If userSessions are loaded and there's at least one session, set the first one as current
        if (userSessions && userSessions.length > 0 && !currentSessionId) {
          const firstSessionId = userSessions[0]?.id; 
          if (firstSessionId) {
            logger.info(COMPONENT_NAME, `Setting current session ID to: ${firstSessionId}`);
            setCurrentSessionId(firstSessionId.toString());
          }
        }
      }
    }

    return () => {
      logger.info(COMPONENT_NAME, "Component unmounted.");
    };
  }, [isAuthenticated, authIsLoading, router, userInfo, userSessions, currentSessionId]);

  useEffect(() => {
    if (recentMessages) {
      setMessages(recentMessages);
    }
  }, [recentMessages]);

  const handleSessionChange = (sessionId: string) => {
    logger.info(COMPONENT_NAME, `Changing to session ID: ${sessionId}`);
    setCurrentSessionId(sessionId);
    refetchRecentMessages();
  };

  const handleNewChat = async () => {
    if (!userInfo) {
      logger.warn(COMPONENT_NAME, "Cannot create new chat, user info not available.");
      return;
    }
    logger.info(COMPONENT_NAME, "Attempting to create a new chat session.");
    try {
      const newSession = await createSession.mutateAsync({
        userId: userInfo.userId,
        // Optionally, you can provide a default title or let the backend handle it
        // title: "New Chat"
      });
      logger.info(COMPONENT_NAME, "New chat session created successfully:", newSession);
      setCurrentSessionId(newSession.id); // Switch to the new session
      // userSessions query will be invalidated by the hook, so no need to manually refetch here
    } catch (error) {
      logger.error(COMPONENT_NAME, "Error creating new chat session:", error);
      // Handle error (e.g., show a notification to the user)
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentSessionId || !userInfo) return;
    
    setIsSending(true);
    try {
      // Implement your API call to send a message here
      // This is a placeholder - you'll need to update your API client
      logger.info(COMPONENT_NAME, `Sending message to session ${currentSessionId}: ${newMessage}`);
      
      // Example POST request structure
      // await postChatMessage({
      //   sessionId: currentSessionId,
      //   userId: userInfo.userId,
      //   senderName: 'Người dùng',
      //   isUser: true,
      //   content: newMessage
      // });
      
      setNewMessage('');
      // After sending a message, refetch recent messages to include the new one
      refetchRecentMessages(); 
    } catch (error) {
      logger.error(COMPONENT_NAME, "Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLogout = () => {
    logger.info(COMPONENT_NAME, "User logging out.");
    localStorage.removeItem('appToken');
    localStorage.removeItem('userInfo');
    dispatch(clearAuth());
    router.push('/');
  }; 

  // Add effect to handle orientation change and screen resize
  useEffect(() => {
    // Close sidebar when changing sessions on mobile
    if (showSidebar && window.innerWidth < 768) {
      setShowSidebar(false);
    }
  }, [currentSessionId]);

  // Add effect to handle orientation change
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        // Automatically show sidebar on desktop
        setShowSidebar(true);
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add effect to close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
        setActiveSessionMenu(null); // Close session menu when clicking outside
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // New states for modal dialogs
  const [deleteMessageDialogOpen, setDeleteMessageDialogOpen] = useState<boolean>(false);
  const [deleteSessionDialogOpen, setDeleteSessionDialogOpen] = useState<boolean>(false);

  // Updated message deletion handling
  const handleDeleteMessageClick = (messageId: number) => {
    setMessageToDelete(messageId);
    setDeleteMessageDialogOpen(true);
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete || !currentSessionId) return;

    setIsDeletingMessage(messageToDelete);
    
    try {
      logger.info(COMPONENT_NAME, `Deleting message with ID: ${messageToDelete} from session ${currentSessionId}`);
      await deleteMessage.mutateAsync({ 
        messageId: messageToDelete, 
        sessionId: currentSessionId
      });
      logger.info(COMPONENT_NAME, `Message with ID: ${messageToDelete} deleted successfully`);
      setDeleteMessageDialogOpen(false);
    } catch (error) {
      logger.error(COMPONENT_NAME, "Error deleting message:", error);
    } finally {
      setIsDeletingMessage(null);
      setMessageToDelete(null);
      setActiveMenu(null);
    }
  };

  // Updated session deletion handling
  const handleDeleteSessionClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteSessionDialogOpen(true);
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;

    setIsDeletingSession(sessionToDelete);
    
    try {
      logger.info(COMPONENT_NAME, `Deleting session with ID: ${sessionToDelete}`);
      
      // Find a new session to switch to before deleting the current one
      let nextSessionId: string | null = null;
      
      // If current session is being deleted, prepare to switch
      if (currentSessionId === sessionToDelete) {
        // Immediately set to null to prevent further requests with the deleted ID
        setCurrentSessionId(null);
        
        // Find next available session
        const remainingSessions = userSessions?.filter(s => s.id !== sessionToDelete);
        if (remainingSessions?.length) {
          nextSessionId = remainingSessions[0].id;
        }
      }
      
      // Delete the session
      await deleteSession.mutateAsync(sessionToDelete);
      logger.info(COMPONENT_NAME, `Session with ID: ${sessionToDelete} deleted successfully`);
      
      // If we identified a next session to switch to, do it after a short delay
      if (nextSessionId) {
        setTimeout(() => {
          logger.info(COMPONENT_NAME, `Switching to next session: ${nextSessionId}`);
          setCurrentSessionId(nextSessionId);
        }, 200);
      }
      
      setDeleteSessionDialogOpen(false);
    } catch (error) {
      logger.error(COMPONENT_NAME, "Error deleting session:", error);
    } finally {
      setIsDeletingSession(null);
      setSessionToDelete(null);
      setActiveSessionMenu(null);
    }
  };

  // Add this useEffect to detect and handle invalid current session IDs
  useEffect(() => {
    // If we have sessions data and a currentSessionId
    if (userSessions && currentSessionId) {
      // Check if the currentSessionId still exists in the sessions list
      const sessionExists = userSessions.some(session => session.id === currentSessionId);
      
      if (!sessionExists) {
        logger.warn(COMPONENT_NAME, `Current session ID ${currentSessionId} not found in user sessions. It may have been deleted.`);
        
        // Reset to another available session or null if none exist
        if (userSessions.length > 0) {
          logger.info(COMPONENT_NAME, `Switching to available session: ${userSessions[0].id}`);
          setCurrentSessionId(userSessions[0].id);
        } else {
          logger.info(COMPONENT_NAME, "No sessions available, setting currentSessionId to null");
          setCurrentSessionId(null);
        }
      }
    }
  }, [userSessions, currentSessionId]);

  if (isPageLoading || authIsLoading || sessionsLoading || recentMessagesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-50 to-secondary-100">
        <div className="bg-secondary-100/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col items-center w-11/12 max-w-md">
          <div className="w-16 h-16 sm:w-20 sm:h-20 border-t-4 border-b-4 border-primary-700 rounded-full animate-spin mb-4 sm:mb-6"></div>
          <h2 className="text-lg sm:text-xl font-medium text-primary-800 mb-2">Đang tải...</h2>
          <p className="text-sm sm:text-base text-primary-600">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    logger.debug(COMPONENT_NAME, "Render check: Not authenticated, returning null (should be redirected).");
    return null; 
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-secondary-100 flex flex-col">
      <Header 
        userInfo={userInfo} 
        showSidebar={showSidebar} 
        setShowSidebar={setShowSidebar}
        handleLogout={handleLogout}
      />
      
      <MainLayout>
        <Sidebar 
          userSessions={userSessions}
          sessionsLoading={sessionsLoading}
          currentSessionId={currentSessionId}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          handleSessionChange={handleSessionChange}
          handleDeleteSessionClick={handleDeleteSessionClick}
          handleNewChat={handleNewChat} // Pass the new handler to Sidebar
        />
        
        <ChatArea 
          currentSessionId={currentSessionId}
          setCurrentSessionId={setCurrentSessionId}  // Add this prop
          userSessions={userSessions}
          messages={messages}
          isSending={isSending}
          recentMessagesLoading={recentMessagesLoading}
          recentMessagesError={recentMessagesError}
          isRefetchingMessages={isRefetchingMessages}
          refetchMessages={refetchRecentMessages}
          isDeletingMessage={isDeletingMessage}
          messagesEndRef={messagesEndRef}
          handleDeleteMessageClick={handleDeleteMessageClick}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handleSendMessage={handleSendMessage}
          handleKeyPress={handleKeyPress}
          handleNewChat={handleNewChat} // Add the missing prop
        />
      </MainLayout>

      {/* Dialog Components */}
      <DeleteMessageDialog
        open={deleteMessageDialogOpen}
        onOpenChange={setDeleteMessageDialogOpen}
        onDelete={handleDeleteMessage}
        onCancel={() => {
          setDeleteMessageDialogOpen(false);
          setMessageToDelete(null);
        }}
        isDeleting={isDeletingMessage !== null}
      />

      <DeleteSessionDialog
        open={deleteSessionDialogOpen}
        onOpenChange={setDeleteSessionDialogOpen}
        onDelete={handleDeleteSession}
        onCancel={() => {
          setDeleteSessionDialogOpen(false);
          setSessionToDelete(null);
        }}
        isDeleting={isDeletingSession !== null}
      />
    </div>
  );
}
