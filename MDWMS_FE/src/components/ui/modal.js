import React from 'react';
import { cn } from '../../utils/cn';
import { X } from './icons';

const Modal = ({ isOpen, onClose, children, className }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={cn(
        "relative bg-white rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto",
        className
      )}>
        {children}
      </div>
    </div>
  );
};

const ModalHeader = ({ children, onClose }) => (
  <div className="flex items-center justify-between p-6 border-b border-gray-200">
    <div className="flex-1">{children}</div>
    {onClose && (
      <button
        onClick={onClose}
        className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <X className="w-5 h-5 text-gray-500" />
      </button>
    )}
  </div>
);

const ModalContent = ({ children, className }) => (
  <div className={cn("p-6", className)}>
    {children}
  </div>
);

const ModalFooter = ({ children, className }) => (
  <div className={cn("flex gap-4 justify-center pt-6 border-t border-gray-200", className)}>
    {children}
  </div>
);

export { Modal, ModalHeader, ModalContent, ModalFooter };
