import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { PLACES, LESSONS, computeFlame } from '../utils/labPhysics';

const SPRAY_MS = 1600;
const FIZZLE_MS = 1400;

const initialState = {
  placeId: 'earth',
  gravity: 1,
  o2: 21,
  materialId: 'paper',
  status: 'ready', // ready | burning | fizzle | extinguishing | out
  fuel: 1,
  spraying: false,
  heatVision: false,
  labels: true,
  coolFlame: false,
  fizzled: false,
  burnedOut: false,
  alarm: false,
  guided: true,
  lesson: 0,
};

const freshSample = { status: 'ready', fuel: 1, coolFlame: false, fizzled: false, burnedOut: false };

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PLACE': {
      const place = PLACES.find((p) => p.id === action.placeId);
      return { ...state, placeId: place.id, gravity: action.gravity ?? place.gravity, o2: action.o2 ?? place.o2, coolFlame: false };
    }
    case 'SET_GRAVITY':
      return { ...state, gravity: action.value };
    case 'SET_O2':
      return { ...state, o2: action.value };
    case 'SET_MATERIAL':
      return { ...state, materialId: action.materialId, ...freshSample };
    case 'IGNITE': {
      if (state.status === 'burning' || state.status === 'extinguishing') return state;
      const fuel = state.fuel < 0.05 ? 1 : state.fuel;
      const { canBurn } = computeFlame(state);
      return { ...state, fuel, coolFlame: false, burnedOut: false, fizzled: !canBurn, status: canBurn ? 'burning' : 'fizzle' };
    }
    case 'FIZZLE_END':
      return state.status === 'fizzle' ? { ...state, status: 'out' } : state;
    case 'SPRAY':
      if (state.spraying) return state;
      return { ...state, spraying: true, wasBurning: state.status === 'burning', status: state.status === 'burning' ? 'extinguishing' : state.status };
    case 'SPRAY_END': {
      const cool = state.wasBurning && state.materialId === 'droplet' && state.gravity < 0.05;
      return { ...state, spraying: false, status: state.wasBurning ? 'out' : state.status, coolFlame: cool || state.coolFlame, fizzled: false };
    }
    case 'TICK': {
      if (state.status !== 'burning') return state;
      const { size, canBurn } = computeFlame(state);
      if (!canBurn) return { ...state, status: 'out', fizzled: true };
      const fuel = state.fuel - action.dt * (0.02 + size * 0.035);
      if (fuel <= 0) {
        const cool = state.materialId === 'droplet' && state.gravity < 0.05;
        return { ...state, fuel: 0, status: 'out', burnedOut: !cool, coolFlame: cool };
      }
      return { ...state, fuel };
    }
    case 'SET_ALARM':
      return state.alarm === action.value ? state : { ...state, alarm: action.value };
    case 'TOGGLE':
      return { ...state, [action.key]: action.value ?? !state[action.key] };
    case 'RESET':
      return { ...state, ...freshSample, spraying: false };
    case 'APPLY_LESSON': {
      const { setup } = LESSONS[action.index];
      let next = { ...state, lesson: action.index, ...freshSample, spraying: false };
      if (setup.placeId) {
        const place = PLACES.find((p) => p.id === setup.placeId);
        next = { ...next, placeId: place.id, gravity: place.gravity, o2: place.o2 };
      }
      if (setup.materialId) next.materialId = setup.materialId;
      if (setup.labels !== undefined) next.labels = setup.labels;
      if (setup.heatVision !== undefined) next.heatVision = setup.heatVision;
      return next;
    }
    default:
      return state;
  }
}

/** State machine + timers for the 3D Flame Lab simulation. */
export function useFlameLab() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Burn the fuel down while the fire is lit.
  useEffect(() => {
    if (state.status !== 'burning') return undefined;
    const id = setInterval(() => dispatch({ type: 'TICK', dt: 0.2 }), 200);
    return () => clearInterval(id);
  }, [state.status]);

  useEffect(() => {
    if (state.status !== 'fizzle') return undefined;
    const id = setTimeout(() => dispatch({ type: 'FIZZLE_END' }), FIZZLE_MS);
    return () => clearTimeout(id);
  }, [state.status]);

  useEffect(() => {
    if (!state.spraying) return undefined;
    const id = setTimeout(() => dispatch({ type: 'SPRAY_END' }), SPRAY_MS);
    return () => clearTimeout(id);
  }, [state.spraying]);

  const flame = useMemo(() => computeFlame(state), [state.gravity, state.o2, state.materialId]); // eslint-disable-line react-hooks/exhaustive-deps

  const goToLesson = useCallback((index) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    dispatch({ type: 'APPLY_LESSON', index });
    const { action } = LESSONS[index];
    if (action === 'ignite' || action === 'ignite-then-spray') later(() => dispatch({ type: 'IGNITE' }), 700);
    if (action === 'ignite-then-spray') later(() => dispatch({ type: 'SPRAY' }), 4200);
  }, []);

  const actions = useMemo(
    () => ({
      setPlace: (placeId, overrides = {}) => dispatch({ type: 'SET_PLACE', placeId, ...overrides }),
      setGravity: (value) => dispatch({ type: 'SET_GRAVITY', value }),
      setO2: (value) => dispatch({ type: 'SET_O2', value }),
      setMaterial: (materialId) => dispatch({ type: 'SET_MATERIAL', materialId }),
      ignite: () => dispatch({ type: 'IGNITE' }),
      spray: () => dispatch({ type: 'SPRAY' }),
      reset: () => dispatch({ type: 'RESET' }),
      setAlarm: (value) => dispatch({ type: 'SET_ALARM', value }),
      toggle: (key, value) => dispatch({ type: 'TOGGLE', key, value }),
      goToLesson,
    }),
    [goToLesson],
  );

  return { state, flame, actions };
}
