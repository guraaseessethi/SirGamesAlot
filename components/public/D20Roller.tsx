'use client';

import { useEffect, useRef, useState } from 'react';
import { D20 } from '@/components/ui/D20';
import { Verify } from '@/components/ui/Verify';
import { useRepoData } from '@/lib/data/hooks';
import { rollAnnouncement, rollD20, rollMessage } from '@/lib/d20';
import styles from './D20Roller.module.css';

export function D20Roller({ initialPromoEnabled }: { initialPromoEnabled: boolean }) {
  const promo = useRepoData(async (r) => (await r.getSettings()).d20PromoEnabled, initialPromoEnabled);
  const [result, setResult] = useState<number | null>(null);
  const [rolling, setRolling] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  function roll() {
    const n = rollD20();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      // No spinning: show the result straight away.
      setResult(n);
      return;
    }
    timers.current.forEach(clearTimeout);
    setRolling((k) => k + 1);
    timers.current = [setTimeout(() => setResult(n), 380)];
  }

  return (
    <div className={styles.rollbox}>
      <button className={styles.die} type="button" onClick={roll} aria-label="Roll the twenty-sided die" data-testid="die">
        <span key={rolling} className={rolling > 0 ? styles.spin : ''}>
          <D20 number={result ?? 20} />
        </span>
      </button>
      <div>
        <div className="kick">The Sir Games-A-Lot tradition</div>
        <h2 className={styles.h2}>{promo ? 'Take 10% off, or roll for it.' : 'The d20 is resting.'}</h2>
        <div className={styles.res}>
          <div className={styles.top2}>
            <span className={styles.tap}>{result === null ? 'Tap the die' : 'You rolled'}</span>
            <span className={styles.big} data-testid="roll-number" aria-hidden="true">
              {result === null ? '?' : `${result}%`}
            </span>
          </div>
          <div className={styles.bd}>
            <p data-testid="roll-text">
              {result !== null
                ? rollMessage(result)
                : promo
                  ? 'At our event days you choose: a sure 10% off, or roll a d20 for 1 to 20% off. Feeling lucky?'
                  : "The take-10%-or-roll discount isn't running right now, but the die still rolls."}
            </p>
            <p className={styles.note}>
              Just for fun here. The real roll happens at the counter on event days. <Verify note="is the d20 discount still running, and what are the exact rules?" />
            </p>
          </div>
        </div>
        {/* One polite live region announces the result; the visible box above is not live, so it is not read twice. */}
        <div className="sr-only" role="status" aria-live="polite" data-testid="roll-live">
          {result !== null ? rollAnnouncement(result) : ''}
        </div>
      </div>
    </div>
  );
}
