"use client";

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatMessage {
  id: number;
  sessionId: string;
  userId: number;
  senderName: string;
  isUser: boolean;
  content: string;
  timestamp: string;
}

interface MessageProps {
  message: ChatMessage;
  isDeletingMessage: number | null;
  handleDeleteMessageClick: (messageId: number) => void;
}

function Message({ message: msg, isDeletingMessage, handleDeleteMessageClick }: MessageProps) {
  return (
    <div className="flex group relative py-1.5">
      {/* Message flex container with messenger-style menu positioning */}
      <div className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} w-full relative`}>
        {!msg.isUser && (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Message bubble with Facebook Messenger style menu */}
        <div className="relative max-w-[75%] sm:max-w-[80%]">
          <div 
            className={`relative rounded-2xl p-3 sm:p-4 shadow-md transition-all
              ${msg.isUser 
                ? 'bg-gradient-to-r from-primary-700 to-primary-900 text-white rounded-br-none transform hover:-translate-y-1 focus-within:ring-2 focus-within:ring-primary-500' 
                : 'bg-secondary-100 text-primary-900 rounded-bl-none hover:shadow-lg focus-within:ring-2 focus-within:ring-primary-300'
              }`}
          >
            <div>
              {/* Message header with timestamp */}
              <div className={`text-[10px] sm:text-xs mb-1 font-medium flex justify-between items-center ${msg.isUser ? 'text-primary-200' : 'text-primary-600'}`}>
                <span>{msg.senderName}</span>
                <span className="ml-4">
                  {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              {/* Message content */}
              <div className={`whitespace-pre-wrap text-sm sm:text-base ${msg.isUser ? 'text-white' : 'text-primary-800'}`}>
                {msg.content}
              </div>
            </div>
          </div>

          {/* Facebook Messenger style menu button with dropdown directly attached */}
          <div 
            className={`absolute ${msg.isUser ? '-left-3 -bottom-2' : '-right-3 -bottom-2'} transition-opacity z-10
              ${isDeletingMessage === msg.id 
                ? 'opacity-100' 
                : 'opacity-0 group-hover:opacity-100 active:opacity-100'}`}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="p-1.5 rounded-full transition-colors duration-200 bg-white shadow-md text-gray-600 hover:text-primary-700 hover:bg-gray-50"
                  aria-label="Message options"
                  title="Message options"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align={msg.isUser ? "start" : "end"} 
                className="w-max py-2 bg-white rounded-lg shadow-lg border border-secondary-200"
              >
                <DropdownMenuItem 
                  className="text-red-600 cursor-pointer flex items-center gap-2"
                  onClick={() => handleDeleteMessageClick(msg.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Xóa tin nhắn
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-primary-700 cursor-pointer flex items-center gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(msg.content);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Sao chép
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {msg.isUser && (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center ml-2 mt-1 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

export default Message;
