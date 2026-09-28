import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Move3d, MousePointerClick, GraduationCap, Gamepad2, ScanEye } from 'lucide-react';
import { useMission } from '../hooks/useMission';
import { useFlameLab } from '../hooks/useFlameLab';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useGame } from '../hooks/useGame';
import { useInView } from '../hooks/useInView';
import { PLACES, PHASE_TO_PLACE, explain } from '../utils/labPhysics';
import Panel from './Panel';
import LabControls from './lab/LabControls';
import LessonCard from './lab/LessonCard';
import ExplainCard from './lab/ExplainCard';
import LabReadouts from './lab/LabReadouts';
import LabChallenges from './lab/LabChallenges';
import styles from './FlameLab.module.css';

const LabScene = lazy(() => import('./lab/LabScene'));

function SceneLoader() {
  return (
    <div className={styles.loader} role="status">
      <span className={styles.spinner} aria-hidden="true" />
      Building the space lab…
    </div>
  );
}

/** 3D Flame Lab: an interactive, kid-friendly microgravity fire simulation. */
export default function FlameLab() {
  const { state, flame, actions } = useFlameLab();
  const { phase } = useMission();
  const coarse = useMediaQuery('(pointer: coarse)');
  const [rotateOn, setRotateOn] = useState(false);
  const [started, setStarted] = useState(false);
  const [toast, setToast] = useState(null);
  const firstPhase = useRef(true);
  const firstPlace = useRef(true);
  const prevStatus = useRef(state.status);
  const { unlock } = useGame();
  const [stageRef, inView] = useInView('300px');

  // Lab challenges → badges.
  useEffect(() => {
    const was = prevStatus.current;
    prevStatus.current = state.status;
    if (state.status === 'burning') {
      unlock('first-light');
      if (state.gravity < 0.02) unlock('space-ball');
      if (state.materialId === 'nomex' && state.placeId === 'moon') unlock('moon-fire');
    }
    if (was === 'extinguishing' && state.status === 'out') unlock('firefighter');
    if (was === 'burning' && state.status === 'out' && state.fizzled) unlock('starver');
  }, [state.status, state.gravity, state.materialId, state.placeId, state.fizzled, unlock]);

  useEffect(() => {
    if (state.alarm) unlock('alarm-raiser');
  }, [state.alarm, unlock]);

  useEffect(() => {
    if (state.coolFlame && state.heatVision) unlock('ghost-buster');
  }, [state.coolFlame, state.heatVision, unlock]);

  // Follow the dashboard's mission phase (skip first render so kids start on Earth).
  useEffect(() => {
    if (firstPhase.current) {
      firstPhase.current = false;
      return;
    }
    actions.setPlace(PHASE_TO_PLACE[phase.id], { gravity: phase.gravity, o2: phase.o2 });
  }, [phase.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // "Arriving at…" toast whenever the place changes.
  useEffect(() => {
    if (firstPlace.current) {
      firstPlace.current = false;
      return undefined;
    }
    const place = PLACES.find((p) => p.id === state.placeId);
    setToast(place);
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [state.placeId]);

  const goToLesson = (i) => {
    setStarted(true);
    actions.goToLesson(Math.max(0, i));
  };

  const info = explain(state, flame);
  const place = PLACES.find((p) => p.id === state.placeId);
  const controlsEnabled = !coarse || rotateOn;

  return (
    <Panel
      id="lab"
      icon={FlaskConical}
      eyebrow="3D simulation · for curious minds of every age"
      title="Flame Lab: fire in space"
      description="Light a fire on Earth, the space station, the Moon or Mars and watch how gravity and oxygen change it. Drag to look around, click the sample to light it, and click the red extinguisher to put it out."
      actions={
        <div className={styles.mode} role="group" aria-label="Lab mode">
          <button type="button" aria-pressed={state.guided} className={state.guided ? styles.modeOn : ''} onClick={() => actions.toggle('guided', true)}>
            <GraduationCap size={16} aria-hidden="true" /> Lessons
          </button>
          <button type="button" aria-pressed={!state.guided} className={!state.guided ? styles.modeOn : ''} onClick={() => actions.toggle('guided', false)}>
            <Gamepad2 size={16} aria-hidden="true" /> Free play
          </button>
        </div>
      }
    >
      <div className={styles.layout}>
        <div className={styles.stage}>
          <div
            ref={stageRef}
            className={`${styles.canvas} ${state.heatVision ? styles.heat : ''}`}
            role="img"
            aria-label={`3D lab at ${place.name}, gravity ${state.gravity.toFixed(2)} g, ${state.o2}% oxygen. ${info.title}.`}
          >
            {inView ? (
              <Suspense fallback={<SceneLoader />}>
                <LabScene state={state} flame={flame} actions={actions} controlsEnabled={controlsEnabled} />
              </Suspense>
            ) : (
              <SceneLoader />
            )}

            {state.heatVision && (
              <div className={styles.heatBadge} aria-hidden="true">
                <ScanEye size={14} /> HEAT VISION
              </div>
            )}

            <div className={styles.placeChip} aria-hidden="true">
              <span className={styles.placeDot} data-place={state.placeId} />
              {place.name}
              <span className="mono">{state.gravity.toFixed(2)}g</span>
            </div>

            {state.guided && (
              <div className={styles.lessonDesktop}>
                <LessonCard lesson={state.lesson} started={started} onGo={goToLesson} />
              </div>
            )}

            <AnimatePresence>
              {toast && (
                <motion.div
                  key={toast.id}
                  className={styles.toast}
                  initial={{ opacity: 0, y: -12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  aria-hidden="true"
                >
                  <strong>Welcome to {toast.name}</strong>
                  <span>{toast.blurb}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={styles.hint} aria-hidden="true">
              {coarse ? (
                <button type="button" className={`${styles.rotate} ${rotateOn ? styles.rotateOn : ''}`} onClick={() => setRotateOn((v) => !v)}>
                  <Move3d size={16} /> {rotateOn ? 'Rotate on' : 'Tap to rotate'}
                </button>
              ) : (
                <>
                  <MousePointerClick size={14} /> Drag to look around · Scroll to zoom
                </>
              )}
            </div>
          </div>

          {state.guided && (
            <div className={styles.lessonMobile}>
              <LessonCard lesson={state.lesson} started={started} onGo={goToLesson} />
            </div>
          )}

          <LabReadouts state={state} flame={flame} />
        </div>

        <div className={styles.side}>
          <ExplainCard info={info} />
          <LabControls state={state} flame={flame} actions={actions} />
          <LabChallenges />
        </div>
      </div>
    </Panel>
  );
}
