import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface UseToastReturn {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000, // Default 5 seconds
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after duration
    if (newToast.duration !== Infinity) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const success = useCallback((title: string, description?: string) => {
    addToast({
      type: 'success',
      title,
      description,
    });
  }, [addToast]);

  const error = useCallback((title: string, description?: string) => {
    addToast({
      type: 'error',
      title,
      description,
      duration: 7000, // Longer duration for errors
    });
  }, [addToast]);

  const warning = useCallback((title: string, description?: string) => {
    addToast({
      type: 'warning',
      title,
      description,
    });
  }, [addToast]);

  const info = useCallback((title: string, description?: string) => {
    addToast({
      type: 'info',
      title,
      description,
    });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
  };
} 