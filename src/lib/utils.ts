export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return (obj as unknown[]).map((item) => deepClone(item)) as T;
  }

  const source = obj as Record<string, unknown>;
  return Object.keys(source).reduce((acc, key) => {
    acc[key] = deepClone(source[key]);
    return acc;
  }, {} as Record<string, unknown>) as T;
}
