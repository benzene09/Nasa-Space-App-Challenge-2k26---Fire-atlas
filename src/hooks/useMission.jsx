import { createContext, useContext, useMemo, useState } from 'react';
import { MISSION_PHASES } from '../utils/data';

const MissionContext = createContext(null);

/** Shared mission-phase state: every feature re-computes when the phase changes (F2). */
export function MissionProvider({ children }) {
  const [phaseId, setPhaseId] = useState('moon');
  const phase = MISSION_PHASES.find((p) => p.id === phaseId);

  const value = useMemo(
    () => ({
      phase,
      phases: MISSION_PHASES,
      setPhaseId,
      conditions: { o2: phase.o2, pressure: phase.pressure, gravity: phase.gravity },
    }),
    [phase],
  );

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

export function useMission() {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error('useMission must be used inside <MissionProvider>');
  return ctx;
}
