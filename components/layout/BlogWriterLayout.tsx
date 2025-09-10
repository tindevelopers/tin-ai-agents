"use client";

import { useSidebar } from "@/contexts/SidebarContext";
import BlogWriterHeader from "./BlogWriterHeader";
import BlogWriterSidebar from "./BlogWriterSidebar";
import React from "react";

interface BlogWriterLayoutProps {
  children: React.ReactNode;
}

const BlogWriterLayout: React.FC<BlogWriterLayoutProps> = ({ children }) => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[280px]"
    : "lg:ml-[80px]";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <BlogWriterSidebar />
      
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => {
            const { toggleMobileSidebar } = useSidebar();
            toggleMobileSidebar();
          }}
        />
      )}
      
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <BlogWriterHeader />
        
        {/* Page Content */}
        <main className="p-4 mx-auto max-w-7xl md:p-6 lg:p-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[calc(100vh-200px)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default BlogWriterLayout;
