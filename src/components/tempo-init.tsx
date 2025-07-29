"use client";

import { TempoDevtools } from "tempo-devtools";
import { useEffect } from "react";

export function TempoInit() {
  useEffect(() => {
    // Only initialize Tempo in development and when explicitly enabled
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_TEMPO) {
      try {
        TempoDevtools.init();
      } catch (error) {
        console.warn('Tempo devtools failed to initialize:', error);
      }
    }
  }, []);

  return null;
}