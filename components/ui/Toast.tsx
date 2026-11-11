'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import styles from './Toast.module.css';

const ToastContext = createContext<(message: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

/** One polite live region for the whole app, so screen readers hear confirmations too. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const toast = useCallback((text: string) => {
    setMessage('');
    // Clear first so repeating the same text is announced again.
    requestAnimationFrame(() => {
      setMessage(text);
      setShow(true);
    });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 4500);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className={`${styles.toast} ${show ? styles.show : ''}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="toast"
      >
        {message}
      </div>
    </ToastContext.Provider>
  );
}
