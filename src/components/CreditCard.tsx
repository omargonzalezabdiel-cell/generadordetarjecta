import { useState } from 'react';
import { Copy, Check, Wifi, Radio, Wallet } from 'lucide-react';
import type { CardData } from '@/utils/cardGenerator';
import NfcPaymentModal from './NfcPaymentModal';

interface CreditCardProps {
  card: CardData;
  index: number;
}

const brandGradients: Record<string, string> = {
  visa: 'from-blue-600 via-blue-700 to-indigo-900',
  mastercard: 'from-orange-500 via-red-600 to-rose-800',
  amex: 'from-teal-600 via-cyan-700 to-slate-900',
};

function BrandMark({ brand }: { brand: string }) {
  if (brand === 'visa') {
    return <span className="text-xl font-bold italic tracking-tighter text-white">VISA</span>;
  }
  if (brand === 'mastercard') {
    return (
      <div className="flex items-center -space-x-2">
        <div className="w-6 h-6 rounded-full bg-red-500 opacity-90" />
        <div className="w-6 h-6 rounded-full bg-yellow-400 opacity-90 mix-blend-screen" />
      </div>
    );
  }
  return <span className="text-xs font-bold tracking-widest text-white">AMEX</span>;
}

function CopyField({
  label,
  value,
  displayValue,
}: {
  label: string;
  value: string;
  displayValue?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard not available
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:border-white/20 hover:bg-white/10"
    >
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
        <p className="truncate font-mono text-sm text-white">{displayValue ?? value}</p>
      </div>
      {copied ? (
        <Check className="h-4 w-4 shrink-0 text-green-400" />
      ) : (
        <Copy className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-white" />
      )}
    </button>
  );
}

export default function CreditCard({ card, index }: CreditCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [showNfc, setShowNfc] = useState(false);
  const gradient = brandGradients[card.brand];

  return (
    <div
      className="flex flex-col gap-4"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Tarjeta visual */}
      <div
        className="card-flip-container relative aspect-[1.586/1] w-full cursor-pointer"
        style={{ perspective: '1200px' }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="card-flip-inner relative h-full w-full transition-transform duration-700"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Anverso */}
          <div
            className={`absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 shadow-2xl`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />
            <div className="absolute -bottom-12 -left-4 h-32 w-32 rounded-full bg-black/20 blur-xl" />

            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="h-8 w-11 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-inner" />
                <BrandMark brand={card.brand} />
              </div>

              <div>
                <p className="font-mono text-lg tracking-wider text-white drop-shadow sm:text-xl md:text-2xl">
                  {card.numberFormatted}
                </p>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/60">
                    Titular
                  </p>
                  <p className="text-sm font-medium text-white">{card.holder}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-wider text-white/60">
                    Vence
                  </p>
                  <p className="font-mono text-sm text-white">{card.expiry}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-md bg-black/20 px-2 py-1">
                <Wallet className="h-3 w-3 text-emerald-300" />
                <span className="text-[10px] font-medium text-emerald-200">Saldo ilimitado</span>
              </div>
            </div>
          </div>

          {/* Reverso */}
          <div
            className={`absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} shadow-2xl`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="relative flex h-full flex-col gap-3 p-5">
              <div className="-mx-5 h-8 bg-black/80" />
              <div className="flex items-center gap-3">
                <div className="h-7 flex-1 rounded bg-white/90" />
                <div className="flex h-7 w-16 items-center justify-center rounded bg-white/90">
                  <span className="font-mono text-sm font-bold text-slate-800">
                    {card.cvv}
                  </span>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <Wifi className="h-5 w-5 rotate-90 text-white/40" />
                <span className="text-[10px] text-white/50">
                  Clic para voltear
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botón Pago NFC */}
      <button
        onClick={() => setShowNfc(true)}
        className="flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-sm font-semibold text-cyan-300 transition hover:border-cyan-500/50 hover:bg-cyan-500/20 active:scale-95"
      >
        <Radio className="h-4 w-4" />
        Pagar con NFC
      </button>

      {/* Campos de datos */}
      <div className="grid grid-cols-1 gap-2">
        <CopyField label="Número de Tarjeta" value={card.number} displayValue={card.numberFormatted} />
        <div className="grid grid-cols-3 gap-2">
          <CopyField label="Titular" value={card.holder} />
          <CopyField label="Vence" value={card.expiry} />
          <CopyField label="CVV" value={card.cvv} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <CopyField label="BIN" value={card.bin} />
          <CopyField label="Red" value={card.network} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <CopyField label="Cuenta" value={card.accountNumber} />
          <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Saldo</p>
              <p className="font-mono text-sm font-bold text-emerald-400">Ilimitado</p>
            </div>
            <Wallet className="h-4 w-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {showNfc && <NfcPaymentModal card={card} onClose={() => setShowNfc(false)} />}
    </div>
  );
}
