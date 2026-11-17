import { getAnalytics, isSupported } from 'firebase/analytics';
import { app } from '../firebase';

export async function initHostingAnalytics(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const supported = await isSupported();
    if (!supported) return;
    getAnalytics(app);
  } catch {
    // Analytics is optional; ignore offline/blocker/iframe restrictions
  }
}
