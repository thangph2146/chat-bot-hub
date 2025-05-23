"use client";

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";

interface ChatSession {
  id: string;
  userId: number;
  title: string;
  createdAt: string;
  lastUpdatedAt: string;
  messages?: any[];
}

interface SidebarProps {
  userSessions: ChatSession[] | undefined;
  sessionsLoading: boolean;
  currentSessionId: string | null;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  handleSessionChange: (sessionId: string) => void;
  handleDeleteSessionClick: (sessionId: string) => void;
  handleNewChat: () => void; // Added prop for new chat
}

function Sidebar({
  userSessions,
  sessionsLoading,
  currentSessionId,
  showSidebar,
  setShowSidebar,
  handleSessionChange,
  handleDeleteSessionClick,
  handleNewChat // Destructure new prop
}: SidebarProps) {
  return (
    <>
      {/* Chat Sessions Sidebar overlay - improved for touch */}
      <div 
        className={`fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 md:hidden ${showSidebar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowSidebar(false)}
        aria-hidden="true"
      ></div>
      
      <div 
        className={`w-[85%] max-w-xs bg-secondary-100/95 backdrop-blur-sm shadow-xl overflow-y-auto fixed inset-y-0 left-0 z-40 transition-transform duration-300 transform md:relative md:translate-x-0 md:w-full md:max-w-[280px] lg:max-w-[320px] md:mx-3 md:my-3 md:rounded-lg md:border md:border-secondary-300 ${showSidebar ? 'translate-x-0 z-50' : '-translate-x-full'}`}
        aria-label="Chat sessions sidebar"
      >
        <div className="p-3 md:p-4 border-b border-secondary-300 bg-gradient-to-r from-secondary-50 to-primary-50 flex justify-between items-center">
          <h2 className="text-base md:text-lg font-semibold text-primary-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-2 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Lịch sử cuộc trò chuyện
          </h2>
          
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(false)}
            className="md:hidden text-primary-800 hover:bg-primary-100"
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        
        {/* New Chat Button */}
        <div className="p-2 md:p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center p-2.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors duration-200 shadow hover:shadow-md active:bg-primary-800 active:shadow-inner"
            aria-label="Start a new chat session"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Cuộc trò chuyện mới
          </button>
        </div>
        
        <div className="overflow-y-auto px-2 py-2 h-[calc(100%-4rem-3.5rem)] custom-scrollbar"> {/* Adjusted height for new button */}
          {/* Add pull-to-refresh indicator for mobile */}
          <div className="md:hidden w-full flex justify-center py-2 text-primary-400 text-xs">
            <span>↓ Kéo xuống để làm mới</span>
          </div>

          {userSessions && userSessions.map((session: ChatSession) => (
            <div 
              key={session.id} 
              className={`p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md active:bg-primary-600 active:shadow-inner touch-manipulation group relative
                ${currentSessionId === session.id 
                  ? 'bg-gradient-to-r from-primary-700 to-primary-800 text-white shadow-md' 
                  : 'bg-secondary-50 hover:bg-primary-50'}`}
              role="button"
              tabIndex={0}
              aria-selected={currentSessionId === session.id}
              aria-label={`Chat session: ${session.title}`}
              onKeyDown={(e) => e.key === 'Enter' && handleSessionChange(session.id)}
            >
              <div className="flex justify-between items-start">
                <div 
                  className="flex-1" 
                  onClick={() => handleSessionChange(session.id)}
                >
                  <p className={`font-medium text-sm ${currentSessionId === session.id ? 'text-white' : 'text-primary-800'}`}>
                    {session.title}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <p className={`text-xs ${currentSessionId === session.id ? 'text-primary-200' : 'text-primary-500'}`}>
                      {new Date(session.lastUpdatedAt).toLocaleDateString('vi-VN')}
                    </p>
                    <p className={`text-xs ${currentSessionId === session.id ? 'text-primary-200' : 'text-primary-500'}`}>
                      {new Date(session.lastUpdatedAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                
                {/* Session menu button - similar to message menu */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`p-1.5 rounded-full transition-colors duration-200 ${
                          currentSessionId === session.id 
                            ? 'bg-white/20 text-white hover:bg-white/30' 
                            : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                        }`}
                        aria-label="Session options"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem 
                        className="text-red-600 cursor-pointer flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSessionClick(session.id);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Xóa cuộc trò chuyện
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-primary-700 cursor-pointer flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Function to rename session would be here
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Đổi tên
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
          
          {!userSessions?.length && !sessionsLoading && (
            <div className="p-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-primary-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-primary-600 text-sm font-medium">Chưa có cuộc trò chuyện nào</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Sidebar;