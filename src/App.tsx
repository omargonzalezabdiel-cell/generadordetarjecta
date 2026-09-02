import { useState, useCallback } from 'react';
import { Sparkles, Trash2, Download, CreditCard as CardIcon, ShieldCheck, Radio } from 'lucide-react';
import { generateCard, type CardData, type CardBrand } from '@/utils/cardGenerator';
import CreditCard from '@/components/CreditCard';

type BrandFilter = CardBrand | 'random';

const brandOptions: { value: BrandFilter; label: string }[] = [
  { value: 'random', label: 'Aleatoria' },
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'amex', label: 'Amex' },
];

export default function App() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandFilter>('random');
  const [count, setCount] = useState(1);

  const handleGenerate = useCallback(() => {
    const newCards: CardData[] = [];
    for (let i = 0; i < count; i++) {
      if (selectedBrand === 'random') {
        newCards.push(generateCard());
      } else {
        newCards.push(generateCard(selectedBrand as CardBrand));
      }
    }
    setCards((prev) => [...newCards, ...prev]);
  }, [selectedBrand, count]);

  const handleClear = useCallback(() => {
    setCards([]);
  }, []);

  const handleDownloadCSV = useCallback(() => {
    if (cards.length === 0) return;
    const headers = ['Numero', 'Titular', 'Vencimiento', 'CVV', 'Marca', 'BIN', 'Red'];
    const rows = cards.map((c) =>
      [c.number, c.holder, c.expiry, c.cvv, c.brand, c.bin, c.network].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tarjetas-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [cards]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Efectos de fondo */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-1/2 right-1/4 h-96 w-96 rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-emerald-600/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-slate-300">
            <Radio className="h-3.5 w-3.5 text-cyan-400" />
            Pagos NFC reales con Web NFC API
          </div>
          <h1 className="bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl md:text-5xl">
            Generador de Tarjetas
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400 sm:text-base">
            Genera tarjetas con un clic y realiza pagos NFC reales.
          </p>
        </header>

        {/* Controles */}
        <div className="mx-auto mb-10 max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {/* Selector de red */}
            <div className="flex-1">
              <label className="mb-2 block text-xs uppercase tracking-wider text-slate-400">
                Red de Tarjeta
              </label>
              <div className="flex flex-wrap gap-2">
                {brandOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedBrand(opt.value)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      selectedBrand === opt.value
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de cantidad */}
            <div className="sm:w-28">
              <label className="mb-2 block text-xs uppercase tracking-wider text-slate-400">
                Cantidad
              </label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500"
              >
                {[1, 3, 5, 10].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleGenerate}
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:shadow-xl hover:shadow-blue-600/40 active:scale-95"
            >
              <Sparkles className="h-4 w-4 transition group-hover:rotate-12" />
              Generar Datos
            </button>

            {cards.length > 0 && (
              <>
                <button
                  onClick={handleDownloadCSV}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </button>
                <button
                  onClick={handleClear}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpiar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Resultados */}
        {cards.length === 0 ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <CardIcon className="h-10 w-10 text-slate-500" />
            </div>
            <p className="text-slate-400">
              No hay tarjetas aún. Haz clic en <span className="font-semibold text-white">Generar Datos</span> para crear tarjetas.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-400">
                {cards.length} tarjeta{cards.length !== 1 ? 's' : ''} generada{cards.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card, i) => (
                <div key={card.id} className="card-enter">
                  <CreditCard card={card} index={i} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Sección informativa */}
        <section className="mx-auto mt-16 max-w-3xl">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-300">
              <ShieldCheck className="h-4 w-4" />
              Cómo funcionan los números de tarjeta (ISO/IEC 7812)
            </h2>
            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <p>
                Los números de tarjeta (PAN) siguen la norma internacional{' '}
                <span className="font-mono text-amber-200">ISO/IEC 7812</span>. Los
                primeros 6-8 dígitos son el <strong>BIN</strong> (Número de
                Identificación del Banco) que identifica al banco emisor. Los dígitos
                intermedios son el número de cuenta individual, y el último dígito es
                un checksum calculado con el <strong>Algoritmo de Luhn</strong>.
              </p>
              <p>
                El primer dígito (MII) identifica la industria/marca:{' '}
                <span className="font-mono">4</span> = Visa,{' '}
                <span className="font-mono">5/2</span> = Mastercard,{' '}
                <span className="font-mono">3</span> = American Express.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-300">
              <Radio className="h-4 w-4" />
              Tecnología NFC
            </h2>
            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <p>
                Esta app usa la <strong>Web NFC API</strong> nativa del navegador para
                leer y escribir etiquetas NFC reales. Funciona en Chrome y Edge en
                dispositivos Android con NFC activado.
              </p>
              <p>
                <strong>Modo Terminal:</strong> Acerca el teléfono a una etiqueta NFC
                o terminal para leer sus datos y procesar el pago.
              </p>
              <p>
                <strong>Modo Emular Tarjeta:</strong> Escribe los datos de la tarjeta
                generada en una etiqueta NFC física, como si fuera una tarjeta real.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
