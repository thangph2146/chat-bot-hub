"use client";

import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  return (
    <main className="flex-grow flex flex-col md:flex-row h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] landscape:h-[calc(100vh-5rem)]">
      {children}
    </main>
  );
}

export default MainLayout;