"use client";

import React, { useState, useEffect } from 'react';
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { useLogger } from '@/hooks/useLogger';

interface NetworkStatusProps {
  error: any;
  refetch: () => void;
  isRefetching: boolean;
}

export function NetworkStatus({ error, refetch, isRefetching }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const logger = useLogger();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Log errors to help with debugging
  useEffect(() => {
    if (error) {
      logger.error('NetworkStatus', 'Network error detected:', 
        error.message, 
        error.response?.status,
        error.response?.data
      );
    }
  }, [error, logger]);

  if (!error) return null;

  const isNetworkError = error.message === 'Network Error' || !isOnline;
  const isServerError = error.response?.status >= 500;
  const isSessionDeleted = isServerError && error.config?.url?.includes('/session/');

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {isNetworkError ? (
            <WifiOff className="h-5 w-5 text-red-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
        </div>
        <div className="ml-3 w-full">
          <h3 className="text-sm font-medium text-red-800">
            {isNetworkError 
              ? 'Lỗi kết nối mạng' 
              : isSessionDeleted 
                ? 'Phiên trò chuyện không tồn tại' 
                : 'Lỗi khi tải dữ liệu'}
          </h3>
          <div className="mt-1 text-sm text-red-700">
            <p>
              {isNetworkError
                ? 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối internet của bạn.'
                : isSessionDeleted
                  ? 'Phiên trò chuyện này đã bị xóa hoặc không tồn tại.'
                  : `Đã xảy ra lỗi: ${error.message}`}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isRefetching || isSessionDeleted}
              className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                isSessionDeleted 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
              } disabled:opacity-50`}
            >
              {isRefetching ? (
                <>
                  <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
                  Đang thử lại...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  Thử lại
                </>
              )}
            </button>
            <span className="text-xs text-red-600">
              {isOnline ? 'Trực tuyến, nhưng không thể kết nối tới máy chủ' : 'Ngoại tuyến'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
