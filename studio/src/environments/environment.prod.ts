export const environment = {
  production: true,
  apiUrl: (typeof window !== 'undefined' && (window as any).__env?.apiUrl) || 'https://platform-api-bt8o.onrender.com'
};
