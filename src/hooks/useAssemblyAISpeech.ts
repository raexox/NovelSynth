import { useState, useEffect, useRef, useCallback } from 'react';
import { AssemblyAISpeechService } from '../services/assemblyai';

interface UseAssemblyAISpeechOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export const useAssemblyAISpeech = (options?: UseAssemblyAISpeechOptions) => {
  const [isListening, setIsListening] = useState(false);
  const serviceRef = useRef<AssemblyAISpeechService | null>(null);
  const optionsRef = useRef(options);
  const baseTranscriptRef = useRef('');

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const stopListening = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stop();
      serviceRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback((currentInput: string) => {
    baseTranscriptRef.current = currentInput;
    if (serviceRef.current) {
      serviceRef.current.stop();
    }

    const service = new AssemblyAISpeechService({
      onTurn: (turnTranscript, isFinal) => {
        const base = baseTranscriptRef.current;
        const full = base ? `${base.trim()} ${turnTranscript}` : turnTranscript;
        if (full && optionsRef.current?.onResult) {
          optionsRef.current.onResult(full);
        }
        if (isFinal) {
          baseTranscriptRef.current = full;
        }
      },
      onError: (err) => {
        setIsListening(false);
        optionsRef.current?.onError?.(err);
      }
    });

    serviceRef.current = service;
    setIsListening(true);
    service.start();
  }, []);

  const toggleListening = useCallback((currentInput: string) => {
    if (isListening) {
      stopListening();
    } else {
      startListening(currentInput);
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (serviceRef.current) {
        serviceRef.current.stop();
      }
    };
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
    toggleListening
  };
};
