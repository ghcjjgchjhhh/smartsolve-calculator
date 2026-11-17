import { useState, useEffect, useRef, useCallback } from 'react';
import {
  createMediaRecorder,
  requestMicrophoneStream,
  transcribeAudioBlob,
} from '../lib/audioRecorder';

export interface UseVoiceInputOptions {
  language?: string;
  mode?: 'math' | 'general';
}

export function useVoiceInput(
  onTranscript: (text: string) => void,
  options?: UseVoiceInputOptions
) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recorderMode, setRecorderMode] = useState<'speech' | 'ai-audio'>('speech');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const recognitionRef = useRef<any>(null);
  const speechFallbackTriggeredRef = useRef(false);
  const hasSpeechApiRef = useRef(false);
  const forceAiAudioRef = useRef(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopMediaTracks = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const startAiAudioRecorder = useCallback(async () => {
    setVoiceError(null);
    setInterimTranscript('');
    cancelledRef.current = false;

    try {
      const stream = await requestMicrophoneStream();
      mediaStreamRef.current = stream;

      const { recorder, mimeType } = createMediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      setRecordingSeconds(0);
      setRecorderMode('ai-audio');

      recorder.ondataavailable = (ev: BlobEvent) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onerror = () => {
        clearTimer();
        stopMediaTracks();
        setIsListening(false);
        setVoiceError('Microphone recording encountered an error. Please try again.');
      };

      recorder.onstop = async () => {
        clearTimer();
        stopMediaTracks();
        setIsListening(false);
        setRecordingSeconds(0);

        if (cancelledRef.current) {
          audioChunksRef.current = [];
          return;
        }

        const actualMime = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: actualMime });
        audioChunksRef.current = [];

        if (blob.size < 150) {
          setVoiceError('Recording was too short or silent. Tap the mic and speak clearly.');
          return;
        }

        setIsTranscribing(true);
        try {
          const { transcript, noSpeech } = await transcribeAudioBlob(blob, actualMime, {
            language: optionsRef.current?.language,
            mode: optionsRef.current?.mode || 'general',
          });
          if (noSpeech || !transcript) {
            setVoiceError('No clear speech was detected. Please speak closer to your mic and try again.');
            return;
          }
          onTranscriptRef.current(transcript);
        } catch (err: any) {
          setVoiceError(err?.message || 'Failed to transcribe voice recording.');
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start(250);
      setIsListening(true);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      clearTimer();
      stopMediaTracks();
      setIsListening(false);
      setVoiceError(err?.message || 'Could not start microphone recording.');
    }
  }, [clearTimer, stopMediaTracks]);

  const stopAiAudioRecorder = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.requestData();
      } catch {
        // some browsers flush on stop() automatically
      }
      recorder.stop();
    } else {
      clearTimer();
      stopMediaTracks();
      setIsListening(false);
    }
  }, [clearTimer, stopMediaTracks]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const canMediaRecord =
      typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== 'undefined';

    if (!SpeechRecognition && !canMediaRecord) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    if (SpeechRecognition) {
      hasSpeechApiRef.current = true;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = optionsRef.current?.language || 'en-US';

      recognition.onresult = (event: any) => {
        let finalText = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result?.[0]?.transcript || '';
          if (result.isFinal) {
            finalText += text;
          } else {
            interimText += text;
          }
        }

        setInterimTranscript(interimText.trim());
        const cleanedFinal = finalText.trim();
        if (cleanedFinal) {
          onTranscriptRef.current(cleanedFinal);
        }
      };

      recognition.onerror = (event: any) => {
        const code = event?.error || '';
        if (code === 'aborted') {
          setInterimTranscript('');
          setIsListening(false);
          return;
        }
        if (code === 'not-allowed' || code === 'permission-denied') {
          setVoiceError(
            'Microphone permission was denied. Please allow microphone access in your browser settings.'
          );
          setInterimTranscript('');
          setIsListening(false);
          return;
        }
        // In browsers/iframes where Web Speech cloud service fails (network / service-not-allowed / audio-capture),
        // fall back transparently to MediaRecorder + AI Gemini transcription!
        if (
          canMediaRecord &&
          (code === 'network' ||
            code === 'service-not-allowed' ||
            code === 'audio-capture' ||
            code === 'language-not-supported') &&
          !speechFallbackTriggeredRef.current
        ) {
          speechFallbackTriggeredRef.current = true;
          forceAiAudioRef.current = true;
          setInterimTranscript('');
          setIsListening(false);
          void startAiAudioRecorder();
          return;
        }
        if (code !== 'no-speech') {
          setVoiceError(`Voice recognition issue (${code}). Try again or type directly.`);
        }
        setInterimTranscript('');
        setIsListening(false);
      };

      recognition.onend = () => {
        setInterimTranscript('');
        if (!speechFallbackTriggeredRef.current) {
          setIsListening(false);
        }
        speechFallbackTriggeredRef.current = false;
      };

      recognitionRef.current = recognition;
    } else {
      forceAiAudioRef.current = true;
      setRecorderMode('ai-audio');
    }

    return () => {
      cancelledRef.current = true;
      clearTimer();
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore cleanup error
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore cleanup error
        }
      }
      stopMediaTracks();
    };
  }, [clearTimer, startAiAudioRecorder, stopMediaTracks]);

  const stopListening = useCallback(() => {
    if (recorderMode === 'ai-audio' || (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive')) {
      stopAiAudioRecorder();
      return;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setInterimTranscript('');
    setIsListening(false);
  }, [recorderMode, stopAiAudioRecorder]);

  const toggleListening = useCallback(() => {
    if (!isSupported) {
      setVoiceError('Microphone voice input is not available in this browser.');
      return;
    }
    if (isTranscribing) return;

    if (isListening) {
      stopListening();
      return;
    }

    setVoiceError(null);
    setInterimTranscript('');

    if (forceAiAudioRef.current || !hasSpeechApiRef.current || !recognitionRef.current) {
      void startAiAudioRecorder();
      return;
    }

    try {
      recognitionRef.current.lang = optionsRef.current?.language || 'en-US';
      setRecorderMode('speech');
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // Fallback to AI audio recorder if SpeechRecognition cannot start
      forceAiAudioRef.current = true;
      void startAiAudioRecorder();
    }
  }, [isListening, isSupported, isTranscribing, startAiAudioRecorder, stopListening]);

  return {
    isListening,
    isSupported,
    isTranscribing,
    recordingSeconds,
    interimTranscript,
    recorderMode,
    voiceError,
    toggleListening,
    stopListening,
  };
}
