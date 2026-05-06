'use client';

import Link from 'next/link';

interface PhrasebookWord {
  text: string;
  romanization: string | null;
  meaning: string;
  partOfSpeech: string;
  mastered: boolean;
}

interface PhrasebookDay {
  sceneId: string;
  title: string;
  description: string | null;
  dayNumber: number;
  words: PhrasebookWord[];
}

interface Props {
  pathId: string;
  pathTitle: string;
  pathDescription: string | null;
  tripStartDate: string | null;
  days: PhrasebookDay[];
}

export function Phrasebook({ pathId, pathTitle, pathDescription, tripStartDate, days }: Props) {
  const totalWords = days.reduce((acc, d) => acc + d.words.length, 0);
  const masteredCount = days.reduce(
    (acc, d) => acc + d.words.filter((w) => w.mastered).length,
    0
  );

  function handlePrint() {
    window.print();
  }

  return (
    <main className="min-h-screen bg-[color:var(--background)] print:bg-white">
      <style jsx global>{`
        @media print {
          @page { margin: 1.4cm; }
          .no-print { display: none !important; }
          body { background: white !important; }
          a { color: inherit !important; text-decoration: none !important; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto px-5 py-8 print:px-0 print:py-0 space-y-6">
        <div className="no-print flex items-center justify-between">
          <Link
            href={`/trip/${pathId}`}
            className="text-xs font-bold text-[color:var(--text-secondary)] hover:underline"
          >
            ← Back
          </Link>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-full bg-[color:var(--accent-indonesian)] text-white text-xs font-extrabold active:scale-[0.98]"
          >
            Save / Print
          </button>
        </div>

        <header className="space-y-1 print:text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[color:var(--text-secondary)] print:text-black/60">
            Your Bali phrasebook
          </p>
          <h1 className="text-2xl font-extrabold text-[color:var(--foreground)] print:text-black">
            {pathTitle}
          </h1>
          {pathDescription && (
            <p className="text-xs text-[color:var(--text-secondary)] leading-relaxed print:text-black/70">
              {pathDescription}
            </p>
          )}
          <p className="text-xs text-[color:var(--text-secondary)] print:text-black/60 pt-1">
            {totalWords} words · {masteredCount} mastered
            {tripStartDate && ` · trip ${new Date(`${tripStartDate}T00:00:00`).toLocaleDateString()}`}
          </p>
        </header>

        <div className="space-y-5">
          {days.map((day) => (
            <section
              key={day.sceneId}
              className="rounded-2xl border-2 border-[color:var(--border)] bg-[color:var(--card-surface)] p-5 print:border-black/15 print:bg-white print:rounded-none print:p-3 print:break-inside-avoid"
            >
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--text-secondary)] print:text-black/60">
                Day {day.dayNumber}
              </p>
              <h2 className="text-base font-extrabold text-[color:var(--foreground)] mt-1 mb-2 print:text-black">
                {day.title}
              </h2>
              <ul className="space-y-1.5">
                {day.words.map((w, i) => (
                  <li
                    key={i}
                    className="flex items-baseline gap-2 text-sm leading-relaxed"
                  >
                    <span className="font-extrabold text-[color:var(--foreground)] print:text-black">
                      {w.text}
                    </span>
                    {w.romanization && (
                      <span className="text-xs italic text-[color:var(--text-secondary)] print:text-black/60">
                        {w.romanization}
                      </span>
                    )}
                    <span className="text-[color:var(--text-secondary)] print:text-black/80">
                      — {w.meaning}
                    </span>
                    {w.mastered && (
                      <span className="ml-auto text-[10px] font-extrabold text-[color:var(--accent-indonesian)] uppercase tracking-[0.14em] print:text-black/40">
                        ✓
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="no-print text-center text-xs text-[color:var(--text-secondary)] pt-4">
          Tip: tap Save / Print, then choose &ldquo;Save as PDF&rdquo; to keep this on your phone.
        </p>
      </div>
    </main>
  );
}
