/**
 * Performance optimization utilities for React components
 * Provides simple, tested helpers for common performance patterns
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Debounce a function call
 * Delays function execution until after wait time has elapsed since last invocation
 * 
 * @example
 * const debouncedSearch = useDebounce((query) => searchAPI(query), 300);
 */
export function useDebounce<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  return debouncedFunction as T;
}

/**
 * Debounced value hook
 * Returns a value that only updates after the specified delay
 * 
 * @example
 * const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle a function call
 * Ensures function is called at most once per specified time period
 * 
 * @example
 * const throttledScroll = useThrottle((event) => handleScroll(event), 100);
 */
export function useThrottle<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const lastRanRef = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const throttledFunction = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRan = now - lastRanRef.current;

      if (timeSinceLastRan >= delay) {
        callback(...args);
        lastRanRef.current = now;
      } else {
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(
          () => {
            callback(...args);
            lastRanRef.current = Date.now();
          },
          delay - timeSinceLastRan
        );
      }
    },
    [callback, delay]
  );

  return throttledFunction as T;
}

/**
 * Intersection Observer hook for lazy loading
 * Detects when an element is visible in the viewport
 * 
 * @example
 * const ref = useRef(null);
 * const isVisible = useIntersectionObserver(ref, { threshold: 0.5 });
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [elementRef, options]);

  return isIntersecting;
}

/**
 * Window size hook with debouncing
 * Returns current window dimensions, debounced to prevent excessive updates
 * 
 * @example
 * const { width, height } = useWindowSize(150);
 */
export function useWindowSize(debounceMs = 150): { width: number; height: number } {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    let timeoutId: number;

    const handleResize = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, debounceMs);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.clearTimeout(timeoutId);
    };
  }, [debounceMs]);

  return size;
}

/**
 * Toggle hook
 * Simple boolean toggle with helpful utilities
 * 
 * @example
 * const [isOpen, toggle, setOpen] = useToggle(false);
 */
export function useToggle(
  initialValue = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  return [value, toggle, setValue];
}

/**
 * Mount hook
 * Detects if component is mounted (useful for async operations)
 * 
 * @example
 * const isMounted = useIsMounted();
 * if (isMounted()) { setState(data); }
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}

/**
 * Local storage hook with type safety
 * Persists state to localStorage with JSON serialization
 * 
 * @example
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error saving localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}
