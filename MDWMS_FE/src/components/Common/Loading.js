import React from 'react';

export default function Loading({ size = 'medium', text = 'Đang tải...', overlay = false }) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
    xl: 'text-lg'
  };

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-orange-200 border-t-orange-500`}></div>
      {text && (
        <div className="text-center">
          <p className={`${textSizeClasses[size]} text-orange-600 font-semibold`}>
            {text}
          </p>
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 shadow-2xl border border-orange-100">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner />
    </div>
  );
}
