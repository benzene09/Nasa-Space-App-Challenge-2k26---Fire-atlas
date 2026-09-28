import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setSoundEnabled, sfx } from '../utils/sfx';

const KidsContext = createContext({ kids: true, sound: true });
const KEY = 'flameatlas-kids-v1';

function read() {
  try {
    return JSON.parse(window.localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

/** Kids mode (simple words, guide, sounds) vs Pro mode (full scientist dashboard). */
export function KidsProvider({ children }) {
  const saved = typeof window !== 'undefined' ? read() : {};
  const [kids, setKids] = useState(saved.kids ?? true);
  const [sound, setSound] = useState(saved.sound ?? true);
  const [welcomed, setWelcomed] = useState(saved.welcomed ?? false);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ kids, sound, welcomed }));
    } catch {
      /* ignore */
    }
    document.documentElement.toggleAttribute('data-kids', kids);
    setSoundEnabled(sound);
  }, [kids, sound, welcomed]);

  // Soft "pop" on every button press when sounds are on.
  useEffect(() => {
    const onClick = (e) => {
      if (e.target.closest?.('button, [role="button"], a')) sfx.pop();
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  const value = useMemo(() => ({ kids, setKids, sound, setSound, welcomed, setWelcomed }), [kids, sound, welcomed]);
  return <KidsContext.Provider value={value}>{children}</KidsContext.Provider>;
}

export const useKids = () => useContext(KidsContext);

/** Pick the kid or pro version of a value. */
export const useKidText = () => {
  const { kids } = useKids();
  return (kid, pro) => (kids ? kid : pro);
};
