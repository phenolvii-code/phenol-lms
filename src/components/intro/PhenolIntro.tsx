'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import styles from './PhenolIntro.module.css';

/**
 * PhenolIntro — "Resonance"
 *
 * A phenol ring is drawn bond by bond, the oxygen lone pair is pushed into the ring
 * (curly arrow), the double bonds shift (resonance) and δ− appears on the ortho/para
 * carbons. The ring then dissolves into the PHENOL symbol (same pointy-top hexagon),
 * the wordmark rises behind a mask and the formula line fades in.
 *
 * Behaviour: plays once per browser session, skippable (button / Esc), honours
 * prefers-reduced-motion, SVG + CSS only (no libraries), never blocks the page below it.
 *
 * Add `?intro=1` to the URL (or pass `force`) to replay it while testing.
 */

type Props = {
  /** Called once when the intro has finished, was skipped, or was not needed. */
  onDone?: () => void;
  /** Ignore the once-per-session guard. */
  force?: boolean;
  /** Time multiplier: 1 = ~3.2 s, 0.8 = ~2.6 s. */
  speed?: number;
  /** Symbol shown at the end. Must be the pointy-top hexagon symbol. */
  symbolSrc?: string;
};

// UI-only flag. It is NOT used for any authorization decision.
const STORAGE_KEY = 'phenol_intro_seen';

type Phase = 'idle' | 'play' | 'exit' | 'gone';
type Pt = [number, number];

/* ------------------------------ geometry ------------------------------ */

const CENTER: Pt = [200, 215];
const RADIUS = 60;
const f = (n: number) => n.toFixed(2);

// Pointy-top hexagon: V0 is the top vertex (the carbon that carries OH), clockwise.
const V: Pt[] = [-90, -30, 30, 90, 150, 210].map((deg) => {
  const a = (deg * Math.PI) / 180;
  return [CENTER[0] + RADIUS * Math.cos(a), CENTER[1] + RADIUS * Math.sin(a)] as Pt;
});

// Closed outline; the last segment overlaps the first so the top vertex gets a clean join.
const RING_PATH =
  `M${f(V[0][0])} ${f(V[0][1])}` +
  [1, 2, 3, 4, 5, 0, 1].map((i) => ` L${f(V[i][0])} ${f(V[i][1])}`).join('');

// The two Kekulé structures (alternating double bonds).
const KEKULE_A: [number, number][] = [[0, 1], [2, 3], [4, 5]];
const KEKULE_B: [number, number][] = [[1, 2], [3, 4], [5, 0]];

/** Inner parallel line of a double bond: shortened and shifted towards the ring centre. */
function innerLine(a: number, b: number): { x1: string; y1: string; x2: string; y2: string } {
  const s = 0.14;
  const lerp = (p: Pt, q: Pt, t: number): Pt => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const p = lerp(V[a], V[b], s);
  const q = lerp(V[a], V[b], 1 - s);
  const mx = (p[0] + q[0]) / 2;
  const my = (p[1] + q[1]) / 2;
  const dx = CENTER[0] - mx;
  const dy = CENTER[1] - my;
  const len = Math.hypot(dx, dy);
  const ox = (dx / len) * 9;
  const oy = (dy / len) * 9;
  return { x1: f(p[0] + ox), y1: f(p[1] + oy), x2: f(q[0] + ox), y2: f(q[1] + oy) };
}

// C–OH bond (top vertex, going up) and the oxygen label position.
const BOND_O = { x1: f(V[0][0]), y1: f(V[0][1]), x2: f(V[0][0]), y2: '121.00' };
const OH_POS: Pt = [200, 113];

// Curved arrow: from the oxygen lone pair to the C–O bond (electron donation into the ring).
const ARROW_START: Pt = [182, 104];
const ARROW_CTRL: Pt = [166, 129];
const ARROW_END: Pt = [198.5, 139];
const ARROW_PATH = `M${ARROW_START[0]} ${ARROW_START[1]} Q${ARROW_CTRL[0]} ${ARROW_CTRL[1]} ${ARROW_END[0]} ${ARROW_END[1]}`;

function arrowHead(): string {
  const dx = ARROW_END[0] - ARROW_CTRL[0];
  const dy = ARROW_END[1] - ARROW_CTRL[1];
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const back: Pt = [ARROW_END[0] - ux * 9, ARROW_END[1] - uy * 9];
  const px = -uy * 4.6;
  const py = ux * 4.6;
  return (
    `M${f(ARROW_END[0])} ${f(ARROW_END[1])}` +
    ` L${f(back[0] + px)} ${f(back[1] + py)} L${f(back[0] - px)} ${f(back[1] - py)} Z`
  );
}
const ARROW_HEAD = arrowHead();

// δ− on the carbons that become electron-rich: ortho (V1, V5) and para (V3).
const DELTAS: { x: number; y: number; anchor: 'start' | 'middle' | 'end' }[] = [
  { x: V[1][0] + 22, y: V[1][1] - 4, anchor: 'start' },
  { x: V[5][0] - 22, y: V[5][1] - 4, anchor: 'end' },
  { x: V[3][0], y: V[3][1] + 30, anchor: 'middle' },
];

// Symbol artwork is 524×624 with the hexagon occupying (12,13)–(511,611) (a slightly narrower
// hexagon than the regular one drawn here). Scale it midway between "same height" and
// "same width" as the ring so the cross-fade between ring and symbol looks seamless.
const SYMBOL_SCALE = ((2 * RADIUS) / 598 + (Math.sqrt(3) * RADIUS) / 499) / 2;
const SYMBOL = {
  x: CENTER[0] - 261.5 * SYMBOL_SCALE,
  y: CENTER[1] - 311.5 * SYMBOL_SCALE, // hexagon vertical centre is at y = 312 in the artwork
  width: 524 * SYMBOL_SCALE,
  height: 624 * SYMBOL_SCALE,
};

/* ------------------------------- timeline ------------------------------- */
// [delay ms, duration ms] — multiplied by `speed` in CSS.

const T = {
  ring: [0, 550],
  dblA: [400, 300],
  bondO: [650, 200],
  oh: [700, 220],
  arrow: [850, 300],
  head: [1100, 100],
  swapOut: [1250, 280],
  swapIn: [1250, 280],
  deltas: [1350, 300],
  innerOut: [1650, 300],
  ringOut: [1750, 300],
  symbol: [1750, 400],
  word: [1950, 450],
  formula: [2250, 350],
} as const;

const EXIT_AT = 2900;
const EXIT_AT_REDUCED = 1100;
const EXIT_MS = 420;

const tm = ([d, u]: readonly [number, number]): CSSProperties =>
  ({ '--d': d, '--u': u }) as CSSProperties;

/* ------------------------------ component ------------------------------ */

export default function PhenolIntro({
  onDone,
  force = false,
  speed = 1,
  symbolSrc = '/images/phenol-symbol-burgundy.png',
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [reduced, setReduced] = useState(false);

  const timers = useRef<number[]>([]);
  const notified = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const notifyDone = useCallback(() => {
    if (notified.current) return;
    notified.current = true;
    onDoneRef.current?.();
  }, []);

  const finish = useCallback(() => {
    clearTimers();
    setPhase('exit');
    timers.current.push(
      window.setTimeout(() => {
        setPhase('gone');
        notifyDone();
      }, EXIT_MS * speed),
    );
  }, [clearTimers, notifyDone, speed]);

  const finishRef = useRef(finish);
  finishRef.current = finish;

  // Decided once per mounted instance. A ref (not state) so React StrictMode's dev-only
  // "mount → unmount → mount" does not see our own session flag and wrongly skip the intro.
  const decision = useRef<'unknown' | 'play' | 'skip'>('unknown');

  // Decide whether to play (client only, so server HTML stays empty and hydration is safe).
  useEffect(() => {
    if (decision.current === 'unknown') {
      const forced = force || new URLSearchParams(window.location.search).get('intro') === '1';
      let seen = false;
      try {
        seen = window.sessionStorage.getItem(STORAGE_KEY) === '1';
      } catch {
        seen = false;
      }
      decision.current = seen && !forced ? 'skip' : 'play';
      if (decision.current === 'play') {
        try {
          window.sessionStorage.setItem(STORAGE_KEY, '1');
        } catch {
          // Storage unavailable (private mode): the intro simply may replay next visit.
        }
      }
    }

    if (decision.current === 'skip') {
      setPhase('gone');
      notifyDone();
      return undefined;
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReduced(prefersReduced);
    setPhase('play');

    const exitAt = (prefersReduced ? EXIT_AT_REDUCED : EXIT_AT) * speed;
    timers.current.push(window.setTimeout(() => finishRef.current(), exitAt));

    return clearTimers;
  }, [force, speed, clearTimers, notifyDone]);

  // Lock page scroll while the overlay is up; Esc skips.
  useEffect(() => {
    if (phase !== 'play' && phase !== 'exit') return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase === 'play') finishRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [phase]);

  if (phase === 'idle' || phase === 'gone') return null;

  const rootClass = [styles.root, phase === 'exit' ? styles.exit : '', reduced ? styles.reduced : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={rootClass}
      style={{ '--k': speed } as CSSProperties}
      role="status"
      aria-label="PHENOL"
    >
      <button type="button" className={styles.skip} onClick={finish}>
        <span lang="en">Skip</span>
        <span lang="ar">تخطي</span>
      </button>

      <div className={styles.stack}>
        <svg
          className={styles.mol}
          viewBox="90 78 220 240"
          aria-hidden="true"
          focusable="false"
        >
          {/* 1. ring, drawn edge by edge, dissolves into the symbol at the end */}
          <g className={styles.fadeOut} style={tm(T.ringOut)}>
            <path
              className={`${styles.draw} ${styles.ring}`}
              pathLength={1}
              d={RING_PATH}
              style={tm(T.ring)}
            />
          </g>

          <g className={`${styles.inner} ${styles.fadeOut}`} style={tm(T.innerOut)}>
            {/* 2. Kekulé A double bonds, drawn, then swapped out */}
            <g className={styles.fadeOut} style={tm(T.swapOut)}>
              {KEKULE_A.map(([a, b]) => (
                <line
                  key={`a${a}${b}`}
                  className={`${styles.draw} ${styles.dbl}`}
                  pathLength={1}
                  style={tm(T.dblA)}
                  {...innerLine(a, b)}
                />
              ))}
            </g>

            {/* 4. Kekulé B: the double bonds have shifted (resonance) */}
            <g className={styles.fadeIn} style={tm(T.swapIn)}>
              {KEKULE_B.map(([a, b]) => (
                <line key={`b${a}${b}`} className={styles.dbl} {...innerLine(a, b)} />
              ))}
            </g>

            {/* 2b. C–OH */}
            <line
              className={`${styles.draw} ${styles.bond}`}
              pathLength={1}
              style={tm(T.bondO)}
              {...BOND_O}
            />
            <text className={`${styles.oh} ${styles.fadeIn}`} style={tm(T.oh)} x={OH_POS[0]} y={OH_POS[1]}>
              OH
            </text>

            {/* 3. curly arrow: lone pair → ring */}
            <path
              className={`${styles.draw} ${styles.arrow}`}
              pathLength={1}
              d={ARROW_PATH}
              style={tm(T.arrow)}
            />
            <path className={`${styles.head} ${styles.fadeIn}`} d={ARROW_HEAD} style={tm(T.head)} />

            {/* 4b. electron-rich positions */}
            <g className={styles.fadeIn} style={tm(T.deltas)}>
              {DELTAS.map((d) => (
                <text key={`${d.x}-${d.y}`} className={styles.delta} x={f(d.x)} y={f(d.y)} textAnchor={d.anchor}>
                  δ<tspan dy="-6" fontSize="12">−</tspan>
                </text>
              ))}
            </g>
          </g>

          {/* 5. the ring becomes the PHENOL symbol */}
          <image
            className={`${styles.symbol} ${styles.fadeIn}`}
            style={tm(T.symbol)}
            href={symbolSrc}
            x={f(SYMBOL.x)}
            y={f(SYMBOL.y)}
            width={f(SYMBOL.width)}
            height={f(SYMBOL.height)}
          />
        </svg>

        <div className={styles.word}>
          <span className={styles.wordInner} style={tm(T.word)}>
            PHENOL
          </span>
        </div>
        <div className={`${styles.formula} ${styles.fadeIn}`} style={tm(T.formula)}>
          C₆H₅OH — 94.11 g/mol
        </div>
      </div>
    </div>
  );
}
