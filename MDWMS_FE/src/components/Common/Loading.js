import React from 'react';

export default function Loading({ size = 'medium', text = 'Đang tải...', overlay = false }) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-[#237486]`}></div>
      {text && (
        <p className="text-sm text-gray-600 font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-xl">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner />
    </div>
  );
}
