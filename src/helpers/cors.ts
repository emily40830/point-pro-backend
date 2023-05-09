import { CorsOptions, CorsOptionsDelegate, CorsRequest } from 'cors';

const corsOptionDelegate: CorsOptionsDelegate = (
  req: CorsRequest,
  callback: (error: Error | null, options: CorsOptions) => void,
) => {
  const host = req.headers['host'];
  const origin = req.headers['origin'] || '';

  if (!host || !origin) {
    callback(null, { credentials: false, origin: false });
    return;
  }

  if (
    new URL(origin).hostname === 'localhost' ||
    new URL(origin).hostname.includes('ngrok') ||
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1') ||
    new URL(origin).hostname === 'point-pro.vercel.app'
  ) {
    callback(null, { credentials: true, origin: true });
    return;
  }

  callback(null, { credentials: false, origin: false });
};

export default corsOptionDelegate;
