import { buildApiUrl } from './apiClient';

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/aac',
];

export function pickSupportedAudioMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return '';
  }
  if (typeof MediaRecorder.isTypeSupported !== 'function') {
    return '';
  }
  for (const candidate of MIME_CANDIDATES) {
    try {
      if (MediaRecorder.isTypeSupported(candidate)) {
        return candidate;
      }
    } catch {
      // ignore unsupported query error
    }
  }
  return '';
}

export function normalizeAudioMimeType(raw?: string): string {
  let mime = String(raw || 'audio/webm').trim().toLowerCase();
  if (mime.includes(';')) {
    mime = mime.split(';')[0].trim();
  }
  if (mime === 'audio/x-m4a' || mime === 'audio/m4a') return 'audio/mp4';
  if (mime === 'audio/x-wav') return 'audio/wav';
  if (mime === 'audio/mp3') return 'audio/mpeg';
  return mime || 'audio/webm';
}

export function getAudioFileExtension(rawMime?: string): string {
  const mime = normalizeAudioMimeType(rawMime);
  if (mime.includes('mp4') || mime.includes('aac')) return 'm4a';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  return 'webm';
}

export function createMediaRecorder(stream: MediaStream): {
  recorder: MediaRecorder;
  mimeType: string;
} {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('Audio recording is not supported in this browser.');
  }

  const preferredMime = pickSupportedAudioMimeType();
  let recorder: MediaRecorder;
  if (preferredMime) {
    try {
      recorder = new MediaRecorder(stream, { mimeType: preferredMime });
    } catch {
      recorder = new MediaRecorder(stream);
    }
  } else {
    recorder = new MediaRecorder(stream);
  }

  const actualMime = recorder.mimeType || preferredMime || 'audio/webm';
  return { recorder, mimeType: actualMime };
}

export async function requestMicrophoneStream(): Promise<MediaStream> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      'Microphone access is unavailable in this browser or requires a secure HTTPS connection.'
    );
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  } catch (err: any) {
    const name = err?.name || '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      throw new Error(
        'Microphone permission was denied. Please allow microphone access in your browser site settings and try again.'
      );
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      throw new Error('No microphone was found on this device.');
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      throw new Error(
        'Your microphone is currently in use by another app or tab. Close it and try again.'
      );
    }
    // Retry once with plain `{ audio: true }` in case advanced constraints failed on older devices
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (fallbackErr: any) {
      throw new Error(
        fallbackErr?.message || err?.message || 'Could not access the microphone.'
      );
    }
  }
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read recorded audio data.'));
    reader.readAsDataURL(blob);
  });
}

function getClientGeminiKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return (
      (import.meta as any).env?.VITE_GEMINI_API_KEY ||
      localStorage.getItem('gemini_user_api_key') ||
      ''
    );
  } catch {
    return '';
  }
}

export async function transcribeAudioBlob(
  blob: Blob,
  rawMimeType?: string,
  options?: { language?: string; mode?: 'math' | 'general' }
): Promise<{ transcript: string; noSpeech: boolean }> {
  if (!blob || blob.size < 150) {
    throw new Error('Recording was too short or empty. Please speak clearly while recording.');
  }

  const audioBase64 = await blobToBase64(blob);
  const audioMimeType = normalizeAudioMimeType(rawMimeType || blob.type);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const clientKey = getClientGeminiKey();
  if (clientKey) {
    headers['x-gemini-key'] = clientKey;
  }

  const payload = JSON.stringify({
    audioBase64,
    audioMimeType,
    language: options?.language,
    mode: options?.mode || 'general',
  });

  const endpoints = [buildApiUrl('/api/transcribe'), buildApiUrl('/api/ai/transcribe')];
  let lastError = 'Could not transcribe the recording right now.';

  for (const endpoint of endpoints) {
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: payload,
      });

      if (resp.status === 404) continue;

      const text = await resp.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        lastError = `Transcription service error (HTTP ${resp.status}).`;
        continue;
      }

      if (!resp.ok) {
        throw new Error(parsed?.error || lastError);
      }

      return {
        transcript: String(parsed?.transcript || '').trim(),
        noSpeech: Boolean(parsed?.noSpeech),
      };
    } catch (err: any) {
      lastError = err?.message || lastError;
      if (!lastError.includes('404')) {
        throw err;
      }
    }
  }

  throw new Error(lastError);
}
