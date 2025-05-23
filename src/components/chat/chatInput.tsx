"use client";

import React from 'react';
import { Button } from '../ui/button'; // Import Button component

interface ChatInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  isSending: boolean;
}

function ChatInput({ 
  newMessage, 
  setNewMessage, 
  handleSendMessage, 
  handleKeyPress, 
  isSending 
}: ChatInputProps) {
  return (
    <div className="p-3 sm:p-4 bg-secondary-100/80 backdrop-blur-sm border-t border-primary-200 rounded-b-none md:rounded-b-lg sticky bottom-0">
      <div className="flex items-end gap-2 sm:gap-3">
        {/* Add attachment button for mobile */}
        <Button variant="ghost" size="icon" className="text-primary-500 hover:text-primary-700 hidden sm:block p-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </Button>

        <div className="flex-grow relative">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full p-2 sm:p-4 border border-primary-300 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 resize-none transition-all shadow-sm hover:shadow-md text-sm sm:text-base"
            rows={2}
            placeholder="Nhập tin nhắn của bạn..."
            aria-label="Message input"
          />
          <div className="absolute right-2 sm:right-3 bottom-1 sm:bottom-2 text-[10px] sm:text-xs text-primary-500">
            Nhấn Enter để gửi
          </div>
        </div>
        
        <Button
          onClick={handleSendMessage}
          disabled={isSending || !newMessage.trim()}
          aria-label="Send message"
          size="lg" // Adjusted size for better fit with icon and text
          className={`font-medium rounded-full transition-all duration-200 flex items-center space-x-1 sm:space-x-2 px-3 py-3 sm:px-6 sm:py-4
            ${isSending || !newMessage.trim() 
              ? 'bg-secondary-500 cursor-not-allowed text-secondary-300' 
              : 'bg-gradient-to-r from-primary-700 to-primary-900 hover:from-primary-800 hover:to-primary-900 text-white transform hover:scale-105 hover:shadow-lg active:scale-95'} 
            `}
        >
          {isSending ? (
            <>
              <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs sm:text-sm">Đang gửi...</span>
            </>
          ) : (
            <>
              <span className="text-xs sm:text-sm">Gửi</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-accent-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default ChatInput;
