import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComposedChart, Area, Line, Scatter, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Target, ChevronRight, Send } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { MATERIALS } from '../../utils/data';
import { gravityCurve, gravityObservations, predictAt } from '../../utils/models';
import FlameSprite from './FlameSprite';
import Stars from '../game/Stars';
import styles from './GravityGuess.module.css';

const TARGETS = [
  { g: 0.16, name: 'the Moon' },
  { g: 0.38, name: 'Mars' },
  { g: 0.5, name: 'a half-gravity world' },
  { g: 0.25, name: 'a big asteroid base' },
];

function newRound() {
  const t = TARGETS[Math.floor(Math.random() * TARGETS.length)];
  const burnable = MATERIALS.filter((m) => m.base > 0.2);
  const m = burnable[Math.floor(Math.random() * burnable.length)];
  return { target: t, materialId: m.id };
}

/** Gravity Guess: use the 0g and 1g test data to predict flame spread at Moon/Mars gravity. */
export default function GravityGuess() {
  const { addXp, unlock } = useGame();
  const [round, setRound] = useState(newRound);
  const [guess, setGuess] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);

  const material = MATERIALS.find((m) => m.id === round.materialId);
  const curve = useMemo(() => gravityCurve(material), [material]);
  const obs = useMemo(() => gravityObservations(material), [material]);
  const truth = predictAt(material, round.target.g);
  const sd = (truth.band[1] - truth.band[0]) / 4;
  const yMax = Math.ceil(Math.max(...curve.map((c) => c.band[1])) * 1.15 * 2) / 2;
  const value = guess ?? 0;

  const stars = useMemo(() => {
    const err = Math.abs(value - truth.mean);
    return err <= sd ? 3 : err <= sd * 2.2 ? 2 : err <= sd * 4 ? 1 : 0;
  }, [value, truth.mean, sd]);

  const submit = () => {
    setRevealed(true);
    setRoundsPlayed((r) => r + 1);
    setScore((s) => s + stars);
    addXp(5 + stars * 10, `${stars} star${stars === 1 ? '' : 's'}!`);
    if (stars === 3) unlock('gap-filler');
  };

  const next = () => {
    setRound(newRound());
    setGuess(null);
    setRevealed(false);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.brief}>
        <p className={styles.mission}>
          <Target size={16} aria-hidden="true" /> Round {roundsPlayed + (revealed ? 0 : 1)} · Score <span className="mono">{score}★</span>
        </p>
        <h3 className={styles.q}>
          How fast will <span>{material.name}</span> burn on <span>{round.target.name}</span> ({round.target.g}g)?
        </h3>
        <p className={styles.help}>
          The yellow dots are real-style tests from orbit (0g) and Earth (1g). Nobody has tested at {round.target.g}g. Drag the slider to make your best
          scientific guess!
        </p>

        <div className={styles.flames}>
          <figure>
            <FlameSprite gravity={0} size={0.85} width={70} />
            <figcaption>0g</figcaption>
          </figure>
          <figure className={styles.mystery}>
            <FlameSprite gravity={round.target.g} size={0.6 + (value / yMax) * 0.8} width={96} />
            <figcaption>{round.target.g}g · your guess</figcaption>
          </figure>
          <figure>
            <FlameSprite gravity={1} size={0.85} width={70} />
            <figcaption>1g</figcaption>
          </figure>
        </div>

        <label htmlFor="gg-slider" className={styles.sliderLabel}>
          <span>Your prediction</span>
          <span className="mono">{value.toFixed(2)} mm/s</span>
        </label>
        <input
          id="gg-slider"
          type="range"
          className="range"
          min="0"
          max={yMax}
          step="0.01"
          value={value}
          disabled={revealed}
          onChange={(e) => setGuess(Number(e.target.value))}
          style={{ '--fill': `${(value / yMax) * 100}%` }}
        />

        {!revealed ? (
          <button type="button" className={styles.submit} onClick={submit} disabled={guess === null}>
            <Send size={16} aria-hidden="true" /> {guess === null ? 'Move the slider first' : 'Lock in my guess'}
          </button>
        ) : (
          <AnimatePresence>
            <motion.div className={styles.result} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} role="status">
              <Stars value={stars} />
              <p>
                The AI model predicts <strong className="mono">{truth.mean.toFixed(2)} mm/s</strong> (±{(sd * 2).toFixed(2)}). You guessed{' '}
                <strong className="mono">{value.toFixed(2)}</strong>.{' '}
                {stars === 3
                  ? 'Bullseye! You filled the gap like a scientist.'
                  : stars >= 1
                    ? 'Close! Notice how partial gravity can make flames bigger than both ends.'
                    : 'Tip: partial gravity often burns faster than 0g AND 1g.'}
              </p>
              <button type="button" className={styles.submit} onClick={next}>
                Next round <ChevronRight size={16} aria-hidden="true" />
              </button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={curve} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
            <XAxis
              dataKey="g"
              type="number"
              domain={[0, 1]}
              ticks={[0, 0.16, 0.25, 0.38, 0.5, 0.75, 1]}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}g`}
            />
            <YAxis type="number" domain={[0, yMax]} allowDataOverflow tickLine={false} axisLine={false} width={44} tickFormatter={(v) => v.toFixed(1)} />
            {revealed && <Area dataKey="band" stroke="none" fill="rgba(63,212,255,0.22)" isAnimationActive animationDuration={900} />}
            {revealed && <Line dataKey="mean" stroke="#3fd4ff" strokeWidth={2.5} dot={false} animationDuration={900} />}
            <Scatter data={obs} dataKey="obs" fill="#ffb23f" isAnimationActive={false} />
            <ReferenceLine x={round.target.g} stroke="#a78bfa" strokeDasharray="4 4" label={{ value: '?', fill: '#a78bfa', position: 'top', fontSize: 16 }} />
            <Scatter data={[{ g: round.target.g, obs: value }]} dataKey="obs" fill="#ff6a2b" shape="star" isAnimationActive={false} legendType="star" />
          </ComposedChart>
        </ResponsiveContainer>
        <p className={styles.legend}>
          <i className={styles.dotY} /> Test data <i className={styles.dotO} /> Your guess{' '}
          {revealed && (
            <>
              <i className={styles.dotC} /> AI prediction
            </>
          )}
        </p>
      </div>
    </div>
  );
}
