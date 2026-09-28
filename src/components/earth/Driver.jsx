import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { QUIET } from '../../utils/earthImpact';
import { TL, lerp } from './earthConfig';

/** Runs the storm timeline and writes the current interpolated state into liveRef every frame. */
export default function Driver({ impact, launched, playId, liveRef, onEvent }) {
  const t = useRef(-1);
  const fired = useRef({});

  useEffect(() => {
    if (playId > 0) {
      t.current = 0;
      fired.current = {};
    }
  }, [playId]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const L = liveRef.current;
    const emit = (n) => {
      if (!fired.current[n]) {
        fired.current[n] = true;
        onEvent(n);
      }
    };
    let storm;
    let radio;
    let proton;
    let cme = -1;
    let flash = 0;

    if (t.current >= 0) {
      t.current += dt;
      const s = t.current;
      emit('flare');
      flash = Math.max(0, 1 - s / 1.2);
      radio = s >= TL.XRAY ? Math.max(0, 1 - (s - TL.XRAY) / 5) * (impact.R / 5) : 0;
      if (s >= TL.XRAY) emit('xray');
      proton = s >= TL.PROTON ? Math.min(1, (s - TL.PROTON) / 1) * (impact.S / 5) : 0;
      if (s >= TL.PROTON) emit('protons');
      if (s >= TL.CME_LAUNCH) emit('cme');
      cme = s >= TL.CME_LAUNCH ? Math.min(1.4, (s - TL.CME_LAUNCH) / (TL.ARRIVE - TL.CME_LAUNCH)) : -1;
      storm = impact.hit > 0 ? THREE.MathUtils.clamp((s - TL.ARRIVE) / (TL.PEAK - TL.ARRIVE), 0, 1) : 0;
      if (s >= TL.ARRIVE) emit(impact.hit > 0 ? 'impact' : 'miss');
      if (s >= TL.END) {
        emit('peak');
        t.current = -1;
      }
    } else {
      storm = launched && impact.hit > 0 ? 1 : 0;
      radio = launched ? (impact.R / 5) * 0.6 : 0;
      proton = launched ? (impact.S / 5) * 0.6 : 0;
    }

    const k = 1 - Math.exp(-dt * 4);
    L.storm = lerp(L.storm, storm, k);
    L.radio = lerp(L.radio, radio, k);
    L.proton = lerp(L.proton, proton, k);
    L.flash = flash;
    L.cme = cme;
    L.rmp = lerp(QUIET.rmp, impact.rmp, L.storm);
    L.auroraLat = lerp(QUIET.auroraLat, impact.auroraLat, L.storm);
    L.kp = lerp(QUIET.kp, impact.kp, L.storm);
    L.dim = (impact.impacts.power.score / 100) * L.storm;
    L.speed = lerp(400, impact.speed || 400, Math.max(L.storm, cme > 0 ? 0.6 : 0));
  });

  return null;
}
