import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Reverb uses Pusher protocol — make Pusher available globally
if (typeof window !== 'undefined') {
  (window as any).Pusher = Pusher;
}

let echoInstance: Echo<'reverb'> | null = null;

export function getEcho(): Echo<'reverb'> {
  if (typeof window === 'undefined') {
    throw new Error('Echo can only be used in browser');
  }

  if (!echoInstance) {
    const isHttps = process.env.NEXT_PUBLIC_REVERB_SCHEME === 'https';
    
    echoInstance = new Echo({
      broadcaster: 'reverb',
      key: process.env.NEXT_PUBLIC_REVERB_KEY || 'civictwin-key',
      wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || '127.0.0.1',
      wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT) || 80,
      wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT) || 443,
      forceTLS: isHttps,
      enabledTransports: ['ws', 'wss'],
    });
  }

  return echoInstance;
}

export default getEcho;
