import { useEffect, useState } from "react";

// React debounce
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// vanilla TS debounce
export const debounce = <Fn extends (this: any, ...args: any[]) => any>(
  fn: Fn,
  delay: number,
): ((this: ThisParameterType<Fn>, ...args: Parameters<Fn>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  return function (...args: Parameters<Fn>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

export const deepClone = (value: any) => {
  if (value === null || typeof value !== "object") {
    return value;
  }
  const result: any[] | Record<any, any> = Array.isArray(value) ? [] : {};
  for (const key of Object.keys(value)) {
    (result as any)[key] = deepClone(value[key]);
  }
  return result;
};
