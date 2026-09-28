import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, RefreshCw, Play, Radio, Zap, Atom, Cloud, ShieldCheck, Hammer, Satellite, Info, Move3d } from 'lucide-react';
import { useMission } from '../hooks/useMission';
import { useGame } from '../hooks/useGame';
import { useInView } from '../hooks/useInView';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useSpaceWeather } from '../hooks/useSpaceWeather';
import { flareRisk, riskBand, currentRisk, EXPOSURE, fmtTime } from '../utils/spaceWeather';
import Panel from './Panel';
import ModeTabs from './game/ModeTabs';
import RiskGauge from './RiskGauge';
import Stars from './game/Stars';
import FlareTimeline from './solar/FlareTimeline';
import styles from './SolarWatch.module.css';

const SolarScene = lazy(() => import('./solar/SolarScene'));

const EVENT_TEXT = {
  flash: (f) => ({ icon: Zap, time: 'T+0', text: `FLARE! Active region ${f.region || ''} erupts with a ${f.classType} blast of light.` }),
  xray: () => ({ icon: Radio, time: 'T+8 min', text: 'X-rays arrive at light speed. Radios on the sunny side can fade out.' }),
  sep: (f, phaseId) => ({
    icon: Atom,
    time: 'T+20–60 min',
    text:
      phaseId === 'iss'
        ? "Energetic particles arrive, but Earth's magnetic shield deflects most of them!"
        : 'Energetic particles hit the spacecraft! Radiation levels spike.',
  }),
  'sep-weak': () => ({ icon: Atom, time: 'T+20–60 min', text: 'Only a few particles escaped. No particle storm this time.' }),
  cme: () => ({ icon: Cloud, time: 'T+1–3 days', text: 'The CME cloud arrives, shaking magnetic fields and making auroras.' }),
  'cme-miss': () => ({ icon: Cloud, time: 'T+1–3 days', text: 'The CME flies off to the side and misses the crew. Phew!' }),
  end: () => ({ icon: Info, time: 'Done', text: 'Simulation complete. Pick another flare on the timeline!' }),
};

/** Solar Flare Watch: live NASA DONKI flares → 3D simulation + mission risk score + Storm Shelter game. */
export default function SolarWatch() {
  const { phase } = useMission();
  const { addXp, bump, unlock, stats } = useGame();
  const sw = useSpaceWeather(30);
  const coarse = useMediaQuery('(pointer: coarse)');
  const [stageRef, inView] = useInView('300px');
  const [mode, setMode] = useState('explore');
  const [selectedId, setSelectedId] = useState(null);
  const [playId, setPlayId] = useState(0);
  const [feed, setFeed] = useState([]);
  const [rotateOn, setRotateOn] = useState(false);
  // Storm Shelter game
  const [choice, setChoiceState] = useState(null);
  const choiceRef = useRef(null);
  const setChoice = useCallback((c) => {
    choiceRef.current = c;
    setChoiceState(c);
  }, []);
  const [canDecide, setCanDecide] = useState(false);
  const [verdict, setVerdict] = useState(null);

  const flares = sw.flares;
  const strongest = useMemo(() => [...flares].sort((a, b) => b.flux - a.flux)[0], [flares]);
  const flare = flares.find((f) => f.id === selectedId) || strongest;
  const risk = flare ? flareRisk(flare, phase.id, phase.o2) : null;
  const band = risk ? riskBand(risk.score) : null;
  const now = useMemo(() => (sw.asOf ? currentRisk(flares, phase.id, phase.o2, sw.asOf) : { score: 0 }), [flares, phase.id, phase.o2, sw.asOf]);
  const nowBand = riskBand(now.score);
  const hideScore = mode === 'play' && !verdict;

  const play = useCallback(
    (id) => {
      choiceRef.current = null;
      if (id) setSelectedId(id);
      setFeed([]);
      setChoice(null);
      setVerdict(null);
      setCanDecide(false);
      setPlayId((p) => p + 1);
    },
    [setChoice],
  );

  // Auto-play the strongest flare once data arrives.
  useEffect(() => {
    if (!sw.loading && flares.length && playId === 0) play(strongest.id);
  }, [sw.loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const newStorm = () => {
    const pick = flares[Math.floor(Math.random() * flares.length)];
    play(pick.id);
  };

  const onEvent = useCallback(
    (name) => {
      if (!flare) return;
      const e = EVENT_TEXT[name](flare, phase.id);
      setFeed((f) => [{ id: `${name}-${Date.now()}`, ...e }, ...f].slice(0, 4));
      if (mode !== 'play') return;
      if (name === 'xray') setCanDecide(true);
      if (name === 'sep' || name === 'sep-weak') {
        setCanDecide(false);
        const decided = choiceRef.current || 'work';
        const correct = (decided === 'shelter') === risk.shouldShelter;
        setChoice(decided);
        setVerdict({ decided, correct });
        if (correct) {
          addXp(20, 'Smart call, flight director!');
          if (bump('shelterCorrect') >= 3) unlock('storm-watcher');
        } else addXp(5, 'Lesson learned');
      }
    },
    [flare, phase.id, mode, risk, addXp, bump, unlock, setChoice],
  );

  const sourceChip = (
    <span className={`${styles.source} ${sw.live ? styles.live : styles.offline}`} title={sw.errors?.join('\n')}>
      <span className={styles.dot} aria-hidden="true" />
      {sw.loading ? 'Contacting NASA…' : sw.live ? `Live · ${sw.source}` : 'Offline snapshot'}
    </span>
  );

  return (
    <Panel
      id="solar"
      icon={Sun}
      eyebrow="NASA DONKI API · space weather"
      title="Solar Flare Watch"
      description="The Sun sometimes explodes with a solar flare. Its light, energetic particles and giant gas clouds (CMEs) race across space. They can hurt astronauts and zap electronics, and an electrical fault is the #1 way fires start on spacecraft. Pick a real flare from NASA and watch it travel to the crew."
      actions={
        <div className="panel-actions">
          {sourceChip}
          <button type="button" className={styles.refresh} onClick={sw.refresh} disabled={sw.loading} aria-label="Refresh NASA data">
            <RefreshCw size={16} className={sw.loading ? styles.spin : ''} />
          </button>
          <ModeTabs
            id="solar"
            mode={mode}
            onChange={(m) => {
              setMode(m);
              setVerdict(null);
              setChoice(null);
            }}
            playLabel="Storm Shelter"
          />
        </div>
      }
    >
      <div className={styles.layout}>
        <div className={styles.stage} ref={stageRef}>
          {inView && flare ? (
            <Suspense fallback={<div className={styles.loading}>Warming up the Sun…</div>}>
              <SolarScene
                flare={flare}
                risk={risk}
                phaseId={phase.id}
                phaseName={phase.name}
                playId={playId}
                onEvent={onEvent}
                sheltered={choice === 'shelter'}
                controlsEnabled={!coarse || rotateOn}
              />
            </Suspense>
          ) : (
            <div className={styles.loading}>{sw.loading ? 'Downloading flares from NASA…' : 'Simulation paused'}</div>
          )}

          <div className={styles.feed} aria-live="polite">
            <AnimatePresence initial={false}>
              {feed.map((e, i) => {
                const Icon = e.icon;
                return (
                  <motion.div
                    key={e.id}
                    className={styles.event}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: i === 0 ? 1 : 0.55, x: 0 }}
                    exit={{ opacity: 0 }}
                    layout
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span className="mono">{e.time}</span>
                    <p>{e.text}</p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className={styles.controls}>
            {mode === 'explore' ? (
              <button type="button" className={styles.playBtn} onClick={() => play()} disabled={!flare}>
                <Play size={16} aria-hidden="true" /> Replay flare
              </button>
            ) : (
              <button type="button" className={styles.playBtn} onClick={newStorm} disabled={!flares.length}>
                <Zap size={16} aria-hidden="true" /> New storm
              </button>
            )}
            {coarse && (
              <button type="button" className={`${styles.rotate} ${rotateOn ? styles.rotateOn : ''}`} onClick={() => setRotateOn((v) => !v)}>
                <Move3d size={16} aria-hidden="true" /> {rotateOn ? 'Rotate on' : 'Tap to rotate'}
              </button>
            )}
          </div>

          {mode === 'play' && flare && (
            <div className={styles.decision}>
              {!verdict ? (
                <>
                  <p className={styles.dTitle}>
                    You are flight director for <strong>{phase.name}</strong>
                  </p>
                  <p className={styles.dClues}>
                    <span className="mono">{flare.classType}</span> flare ·{' '}
                    {flare.lon >= 15 ? 'west side (aimed our way)' : flare.lon <= -15 ? 'east side' : 'center'} · {flare.hasCME ? 'CME launched' : 'no CME'}
                  </p>
                  <p className={styles.dHint}>
                    {canDecide ? 'X-ray alarm! Decide before the particles arrive:' : 'Watch the Sun… decide when the X-ray alarm sounds.'}
                  </p>
                  <div className={styles.dBtns}>
                    <button
                      type="button"
                      disabled={!canDecide}
                      aria-pressed={choice === 'shelter'}
                      className={`${styles.shelter} ${choice === 'shelter' ? styles.chosen : ''}`}
                      onClick={() => setChoice('shelter')}
                    >
                      <ShieldCheck size={18} aria-hidden="true" /> Take shelter
                    </button>
                    <button
                      type="button"
                      disabled={!canDecide}
                      aria-pressed={choice === 'work'}
                      className={`${styles.work} ${choice === 'work' ? styles.chosen : ''}`}
                      onClick={() => setChoice('work')}
                    >
                      <Hammer size={18} aria-hidden="true" /> Keep working
                    </button>
                  </div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={styles.verdict}>
                  <Stars value={verdict.correct ? 3 : 0} size={24} />
                  <p>
                    <strong>{verdict.correct ? 'Great call!' : 'Not quite.'}</strong>{' '}
                    {risk.shouldShelter
                      ? `Risk was ${risk.score}: sheltering protects the crew from the radiation.`
                      : `Risk was only ${risk.score}: sheltering would waste precious mission time.`}
                  </p>
                  <button type="button" className={styles.playBtn} onClick={newStorm}>
                    <Zap size={16} aria-hidden="true" /> Next storm
                  </button>
                </motion.div>
              )}
              <p className={styles.dScore}>
                Correct calls: <span className="mono">{stats.shelterCorrect || 0}</span> · 3 earns <em>Storm Watcher</em>
              </p>
            </div>
          )}
        </div>

        <aside className={styles.side}>
          <div className={styles.riskCard}>
            <p className={styles.label}>Space-weather risk · {phase.name}</p>
            {hideScore ? (
              <div className={styles.hidden}>
                <Satellite size={28} aria-hidden="true" />
                <p>Risk score hidden until you make your call!</p>
              </div>
            ) : (
              risk && (
                <>
                  <RiskGauge value={risk.score} label={`Space weather: ${band.label}`} tone={band.tone} />
                  <p className={styles.advice}>{band.advice}</p>
                </>
              )
            )}
          </div>

          {risk && !hideScore && (
            <div className={styles.subs}>
              {[
                { k: 'radiation', label: 'Crew radiation', v: risk.radiation },
                { k: 'electronics', label: 'Electronics glitches', v: risk.electronics },
                { k: 'ignition', label: `Fire ignition (at ${phase.o2}% O₂)`, v: risk.ignition },
              ].map((s) => (
                <div key={s.k} className={styles.sub}>
                  <div className={styles.subHead}>
                    <span>{s.label}</span>
                    <span className="mono">{s.v}</span>
                  </div>
                  <div className={styles.bar}>
                    <motion.span
                      className={styles[`bar_${riskBand(s.v).tone}`]}
                      initial={false}
                      animate={{ width: `${s.v}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {flare && (
            <dl className={styles.details}>
              <div>
                <dt>Flare class</dt>
                <dd className="mono">{flare.classType}</dd>
              </div>
              <div>
                <dt>Peak</dt>
                <dd>{fmtTime(flare.peak)}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd className="mono">{flare.location}</dd>
              </div>
              <div>
                <dt>Linked</dt>
                <dd>{mode === 'play' && !verdict ? '???' : [flare.hasCME && 'CME', flare.hasSEP && 'Particle storm'].filter(Boolean).join(' + ') || 'None'}</dd>
              </div>
            </dl>
          )}
          <p className={styles.shield}>
            <ShieldCheck size={14} aria-hidden="true" /> {EXPOSURE[phase.id].why}
          </p>
          <p className={`${styles.now} ${styles[nowBand.tone]}`}>
            Right now ({sw.live ? 'live' : 'as of snapshot'}): <strong>{nowBand.label}</strong> <span className="mono">{now.score}</span>
          </p>
        </aside>
      </div>

      <FlareTimeline flares={flares} selectedId={flare?.id} onSelect={(id) => (mode === 'play' ? null : play(id))} />
      <p className={styles.credit}>
        Data: NASA DONKI (CCMC) solar flare catalog{sw.live ? '' : ' · API unreachable or rate-limited, showing a real snapshot from 26 Aug – 19 Sep 2026'}.
        Risk score is an educational model, not a forecast.
      </p>
    </Panel>
  );
}
