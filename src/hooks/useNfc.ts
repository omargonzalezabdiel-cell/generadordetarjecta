import { useCallback, useRef, useState } from 'react';

export type NfcState = 'idle' | 'scanning' | 'reading' | 'success' | 'error' | 'unsupported';

export interface NfcReadResult {
  serialNumber: string;
  recordType: string;
  data: string;
  mimeType: string;
  timestamp: number;
}

interface UseNfcReturn {
  state: NfcState;
  error: string;
  result: NfcReadResult | null;
  isSupported: boolean;
  startScan: () => Promise<void>;
  stopScan: () => void;
  reset: () => void;
}

export function useNfc(): UseNfcReturn {
  const [state, setState] = useState<NfcState>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<NfcReadResult | null>(null);
  const readerRef = useRef<any>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const isSupported = typeof window !== 'undefined' && 'NDEFReader' in window;

  const stopScan = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    readerRef.current = null;
    setState('idle');
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setError('');
    setResult(null);
  }, []);

  const startScan = useCallback(async () => {
    setError('');
    setResult(null);

    if (!isSupported) {
      setState('unsupported');
      setError(
        'Tu navegador no soporta NFC. Usa Chrome o Edge en Android con NFC activado.'
      );
      return;
    }

    try {
      const reader = new (window as any).NDEFReader();
      readerRef.current = reader;

      const controller = new AbortController();
      controllerRef.current = controller;

      setState('scanning');

      await reader.scan({ signal: controller.signal });

      reader.addEventListener('reading', (event: any) => {
        setState('reading');
        const serial = event.serialNumber || 'Desconocido';
        const records = event.message?.records || [];
        let dataStr = '';
        let recordType = 'desconocido';
        let mimeType = '';

        if (records.length > 0) {
          const record = records[0];
          recordType = record.recordType || 'desconocido';
          mimeType = record.mediaType || '';
          try {
            const textDecoder = new TextDecoder();
            dataStr = textDecoder.decode(record.data);
          } catch {
            const bytes = new Uint8Array(record.data);
            dataStr = Array.from(bytes)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join(' ');
          }
        }

        const readResult: NfcReadResult = {
          serialNumber: serial,
          recordType,
          data: dataStr,
          mimeType,
          timestamp: Date.now(),
        };

        setResult(readResult);
        setState('success');
      });

      reader.addEventListener('readingerror', () => {
        setState('error');
        setError('Error al leer la etiqueta NFC. Acerca la tarjeta de nuevo.');
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setState('idle');
        return;
      }
      if (err.name === 'NotAllowedError') {
        setState('error');
        setError('Permiso NFC denegado. Activa los permisos de NFC en tu navegador.');
      } else {
        setState('error');
        setError(err.message || 'Error al iniciar el escaneo NFC.');
      }
    }
  }, [isSupported]);

  return {
    state,
    error,
    result,
    isSupported,
    startScan,
    stopScan,
    reset,
  };
}

export function useNfcWriter() {
  const [writeState, setWriteState] = useState<NfcState>('idle');
  const [writeError, setWriteError] = useState('');
  const isSupported = typeof window !== 'undefined' && 'NDEFReader' in window;

  const writeCardData = useCallback(
    async (data: string) => {
      if (!isSupported) {
        setWriteState('unsupported');
        setWriteError(
          'Tu navegador no soporta NFC. Usa Chrome o Edge en Android con NFC activado.'
        );
        return;
      }

      setWriteState('scanning');
      setWriteError('');

      try {
        const writer = new (window as any).NDEFReader();
        await writer.write(data);
        setWriteState('success');
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setWriteState('idle');
          return;
        }
        setWriteState('error');
        setWriteError(err.message || 'Error al escribir en la etiqueta NFC.');
      }
    },
    [isSupported]
  );

  const resetWrite = useCallback(() => {
    setWriteState('idle');
    setWriteError('');
  }, []);

  return {
    writeState,
    writeError,
    isSupported,
    writeCardData,
    resetWrite,
  };
}
