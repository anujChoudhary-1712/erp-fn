import Cookies from 'js-cookie';

// Get a cookie by name
export const getCookie = (name: string): string => {
  return Cookies.get(name) || '';
};

// Set a cookie with options
export const setCookie = (
  name: string, 
  value: string, 
  options: Cookies.CookieAttributes = {}
): void => {
  Cookies.set(name, value, options);
};

// Remove a cookie by name
export const removeCookie = (name: string): void => {
  Cookies.remove(name);
};

// Check if a cookie exists
export const hasCookie = (name: string): boolean => {
  return !!Cookies.get(name);
};