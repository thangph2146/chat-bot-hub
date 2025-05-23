"use client";

import React from 'react';
import { Button } from '../ui/button'; // Import Button component

interface HeaderProps {
  userInfo: any;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  handleLogout: () => void;
}

function Header({ userInfo, showSidebar, setShowSidebar, handleLogout }: HeaderProps) {
  return (
    <header className="w-full p-3 sm:p-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center">
        {/* Mobile sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSidebar(!showSidebar)}
          className="md:hidden mr-3 hover:bg-primary-800 active:bg-primary-600"
          aria-label={showSidebar ? "Close sidebar" : "Open sidebar"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showSidebar ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </Button>
        
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-8 sm:w-8 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight">HUB Chat Bot</h1>
        </div>
      </div>
      
      {userInfo && (
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="rounded-full px-2 sm:px-4 py-1.5 backdrop-blur-sm hidden sm:block">
            <span className="text-xs sm:text-sm font-medium">Xin chào, {userInfo.fullName || userInfo.username}!</span>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            className="rounded-full py-1.5 px-3 sm:px-4 sm:text-sm transition-all duration-200 transform hover:scale-105 hover:shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden xs:inline">Đăng xuất</span>
          </Button>
        </div>
      )}
    </header>
  );
}

export default Header;
