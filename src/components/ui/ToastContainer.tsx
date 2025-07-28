"use client";

import React from 'react';
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { useToast } from '@/hooks/useToast';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getToastVariant = (type: string) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={getToastVariant(toast.type)}
          className="flex items-start gap-3"
        >
          <div className="flex items-start gap-3 flex-1">
            {getToastIcon(toast.type)}
            <div className="flex-1">
              <ToastTitle>{toast.title}</ToastTitle>
              {toast.description && (
                <ToastDescription>{toast.description}</ToastDescription>
              )}
            </div>
          </div>
          <ToastClose onClick={() => removeToast(toast.id)} />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
};

export default ToastContainer; 