import { useState, useCallback, useEffect } from 'react';
import {
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  Radio,
  CreditCard,
  Smartphone,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Wallet,
} from 'lucide-react';
import type { CardData } from '@/utils/cardGenerator';
import { savePayment, type NfcPayment } from '@/lib/localDb';
import { useNfc, useNfcWriter, type NfcReadResult } from '@/hooks/useNfc';

interface NfcPaymentModalProps {
  card: CardData;
  onClose: () => void;
}

const COMERCIOS = [
  'TechStore',
  'Café Central',
  'Mercado Fresco',
  'Gasolinera Express',
  'Cine Plus',
  'LibroMundo',
  'DeportZone',
  'ModaShop',
];

const MONEDAS = ['USD', 'EUR', 'MXN', 'COP', 'ARS', 'PEN', 'CLP'];

type Fase = 'config' | 'escaneando' | 'procesando' | 'aprobado' | 'rechazado' | 'nfc-error';

interface TerminalInfo {
  serial: string;
  recordType: string;
  data: string;
  detected: boolean;
}

function decodificarTerminal(result: NfcReadResult): TerminalInfo {
  return {
    serial: result.serialNumber,
    recordType: result.recordType,
    data: result.data || '(sin datos)',
    detected: true,
  };
}

export default function NfcPaymentModal({ card, onClose }: NfcPaymentModalProps) {
  const [monto, setMonto] = useState('25.00');
  const [comercio, setComercio] = useState(COMERCIOS[0]);
  const [moneda, setMoneda] = useState('USD');
  const [fase, setFase] = useState<Fase>('config');
  const [pago, setPago] = useState<NfcPayment | null>(null);
  const [terminal, setTerminal] = useState<TerminalInfo | null>(null);
  const [modoEmulacion, setModoEmulacion] = useState(false);

  const nfc = useNfc();
  const nfcWriter = useNfcWriter();

  useEffect(() => {
    if (nfc.state === 'success' && nfc.result && fase === 'escaneando') {
      const info = decodificarTerminal(nfc.result);
      setTerminal(info);
      nfc.stopScan();
      procesarPago();
    }
    if (nfc.state === 'error' && fase === 'escaneando') {
      setFase('nfc-error');
    }
    if (nfc.state === 'unsupported' && fase === 'escaneando') {
      setFase('nfc-error');
    }
  }, [nfc.state, nfc.result, nfc.error, fase]);

  useEffect(() => {
    if (nfcWriter.writeState === 'success' && modoEmulacion) {
      procesarPago();
    }
    if (nfcWriter.writeState === 'error' && modoEmulacion) {
      setFase('nfc-error');
    }
  }, [nfcWriter.writeState, modoEmulacion]);

  const iniciarEscaneo = useCallback(async () => {
    const montoNumerico = parseFloat(monto);
    if (isNaN(montoNumerico) || montoNumerico <= 0) return;

    setFase('escaneando');
    setTerminal(null);
    nfc.reset();

    if (modoEmulacion) {
      const datosTarjeta = JSON.stringify({
        pan: card.number,
        holder: card.holder,
        expiry: card.expiry,
        brand: card.brand,
        amount: montoNumerico,
        currency: moneda,
        merchant: comercio,
      });
      await nfcWriter.writeCardData(datosTarjeta);
    } else {
      await nfc.startScan();
    }
  }, [monto, card, moneda, comercio, modoEmulacion, nfc, nfcWriter]);

  const procesarPago = useCallback(async () => {
    const montoNumerico = parseFloat(monto);
    if (isNaN(montoNumerico) || montoNumerico <= 0) return;

    setFase('procesando');

    await new Promise((r) => setTimeout(r, 1500));

    const ultimos4 = card.number.slice(-4);
    const aprobado = true;

    try {
      const paymentRecord = await savePayment({
        card_id: card.id,
        card_number: `**** **** **** ${ultimos4}`,
        card_holder: card.holder,
        card_brand: card.brand,
        amount: montoNumerico,
        currency: moneda,
        merchant: comercio,
        status: aprobado ? 'approved' : 'declined',
      });

      setPago(paymentRecord);
      setFase(aprobado ? 'aprobado' : 'rechazado');
    } catch {
      setFase('rechazado');
    }
  }, [monto, card, moneda, comercio]);

  const reiniciar = () => {
    setFase('config');
    setPago(null);
    setTerminal(null);
    nfc.reset();
    nfcWriter.resetWrite();
  };

  const cancelarEscaneo = () => {
    nfc.stopScan();
    nfcWriter.resetWrite();
    setFase('config');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 transition hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-white">
          <Radio className="h-5 w-5 text-cyan-400" />
          Pago NFC
        </h2>
        <p className="mb-2 text-sm text-slate-400">
          {card.network} •••• {card.number.slice(-4)}
        </p>
        <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <Wallet className="h-4 w-4" />
            Saldo disponible
          </div>
          <span className="font-mono text-sm font-bold text-emerald-300">
            {moneda} 999,999,999.99
          </span>
        </div>

        {/* Indicador de soporte NFC */}
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
            nfc.isSupported
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
          }`}
        >
          {nfc.isSupported ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              NFC disponible en este dispositivo
            </>
          ) : (
            <>
              <AlertTriangle className="h-3.5 w-3.5" />
              NFC no detectado — usa Chrome/Edge en Android con NFC activado
            </>
          )}
        </div>

        {/* FASE: Configuración */}
        {fase === 'config' && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">
                Monto
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                  className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                >
                  {MONEDAS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="flex-1 rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">
                Comercio
              </label>
              <select
                value={comercio}
                onChange={(e) => setComercio(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
              >
                {COMERCIOS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Selector de modo */}
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">
                Modo de operación
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setModoEmulacion(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    !modoEmulacion
                      ? 'border border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
                      : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Terminal className="h-4 w-4" />
                  Terminal
                </button>
                <button
                  onClick={() => setModoEmulacion(true)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    modoEmulacion
                      ? 'border border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
                      : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  Emular tarjeta
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {modoEmulacion
                  ? 'Escribe los datos de la tarjeta en una etiqueta NFC física'
                  : 'Lee un terminal o etiqueta NFC real acercando el teléfono'}
              </p>
            </div>

            <button
              onClick={iniciarEscaneo}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-600/30 transition hover:shadow-xl active:scale-95"
            >
              <Radio className="h-5 w-5 animate-pulse" />
              {modoEmulacion ? 'Escribir en etiqueta NFC' : 'Iniciar pago NFC'}
            </button>
          </div>
        )}

        {/* FASE: Escaneando NFC */}
        {fase === 'escaneando' && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-cyan-500/40 bg-cyan-500/10">
                {modoEmulacion ? (
                  <CreditCard className="h-12 w-12 text-cyan-400" />
                ) : (
                  <Radio className="h-12 w-12 text-cyan-400" />
                )}
              </div>
              <div className="absolute inset-0 animate-ping rounded-full border-2 border-cyan-500/30" />
              <div
                className="absolute inset-0 animate-ping rounded-full border-2 border-cyan-500/20"
                style={{ animationDelay: '0.3s' }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-cyan-300">
                {modoEmulacion
                  ? 'Acerca una etiqueta NFC para escribir...'
                  : 'Acerca la tarjeta o terminal al sensor NFC...'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Mantén el dispositivo cerca del sensor NFC
              </p>
            </div>
            <div className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-center text-xs text-slate-400">
              <div className="flex items-center justify-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                Buscando dispositivo NFC...
              </div>
            </div>
            <button
              onClick={cancelarEscaneo}
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* FASE: Procesando */}
        {fase === 'procesando' && (
          <div className="flex flex-col items-center gap-6 py-8">
            {terminal && (
              <div className="w-full space-y-1.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs">
                <div className="flex items-center gap-2 text-cyan-300">
                  <Terminal className="h-3.5 w-3.5" />
                  Terminal detectado
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Serial</span>
                  <span className="font-mono text-white">{terminal.serial}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tipo</span>
                  <span className="font-mono text-white">{terminal.recordType}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Datos</span>
                  <span className="max-w-[160px] truncate font-mono text-white">
                    {terminal.data}
                  </span>
                </div>
              </div>
            )}
            <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
            <p className="text-sm font-medium text-slate-300">
              Procesando pago NFC...
            </p>
          </div>
        )}

        {/* FASE: Aprobado */}
        {fase === 'aprobado' && pago && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15">
              <CheckCircle2 className="h-10 w-10 text-green-400" />
            </div>
            <p className="text-lg font-semibold text-white">Pago Aprobado</p>
            <div className="w-full space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Comercio</span>
                <span className="text-white">{pago.merchant}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Monto</span>
                <span className="font-mono text-white">
                  {pago.currency} {parseFloat(String(pago.amount)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tarjeta</span>
                <span className="font-mono text-white">{pago.card_number}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Titular</span>
                <span className="text-white">{pago.card_holder}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cuenta</span>
                <span className="font-mono text-xs text-white">{card.accountNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Saldo restante</span>
                <span className="font-mono text-xs text-emerald-300">
                  {pago.currency} 999,999,999.99
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Referencia</span>
                <span className="font-mono text-xs text-white">
                  {pago.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              {terminal && (
                <div className="flex justify-between text-slate-400">
                  <span>Terminal</span>
                  <span className="font-mono text-xs text-white">{terminal.serial}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Fecha</span>
                <span className="text-xs text-white">
                  {new Date(pago.created_at).toLocaleString('es-ES')}
                </span>
              </div>
            </div>
            <button
              onClick={reiniciar}
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Nuevo Pago
            </button>
          </div>
        )}

        {/* FASE: Rechazado */}
        {fase === 'rechazado' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15">
              <XCircle className="h-10 w-10 text-red-400" />
            </div>
            <p className="text-lg font-semibold text-white">Pago Rechazado</p>
            <p className="text-sm text-slate-400">
              La transacción no pudo completarse.
            </p>
            <button
              onClick={reiniciar}
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* FASE: Error NFC */}
        {fase === 'nfc-error' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15">
              <AlertTriangle className="h-10 w-10 text-red-400" />
            </div>
            <p className="text-lg font-semibold text-white">Error NFC</p>
            <p className="max-w-xs text-center text-sm text-slate-400">
              {nfc.error || nfcWriter.writeError || 'No se pudo completar la operación NFC.'}
            </p>
            <div className="flex gap-3">
              {nfc.isSupported && (
                <button
                  onClick={() => {
                    nfc.reset();
                    nfcWriter.resetWrite();
                    setFase('config');
                  }}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reintentar
                </button>
              )}
              <button
                onClick={() => {
                  nfc.reset();
                  setFase('config');
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                Volver
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
