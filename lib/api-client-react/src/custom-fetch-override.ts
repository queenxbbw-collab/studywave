import { customFetch as defaultCustomFetch } from "../custom-fetch";

export const customFetch = async <T,>(url: string, options?: RequestInit): Promise<T> => {
  const token = localStorage.getItem("studywave_token");
  const headers = {
    ...options?.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  
  return defaultCustomFetch(url, {
    ...options,
    headers,
  });
};
