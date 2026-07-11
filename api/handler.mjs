import { handler } from '../backend/server.mjs';

export default async function vercelHandler(req, res) {
  const requestUrl = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`);
  const path = requestUrl.searchParams.get('path');

  if (path) {
    requestUrl.searchParams.delete('path');
    const query = requestUrl.searchParams.toString();
    req.url = `/api/${path.replace(/^\/+/, '')}${query ? `?${query}` : ''}`;
  }

  return handler(req, res);
}
