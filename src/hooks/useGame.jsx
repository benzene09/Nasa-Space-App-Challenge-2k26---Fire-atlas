import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BADGES, levelFor } from '../utils/gameData';
import { sfx } from '../utils/sfx';

const GameContext = createContext(null);
const STORAGE_KEY = 'flameatlas-game-v1';

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** XP, levels, badges and toast notifications shared by every mini-game. */
export function GameProvider({ children }) {
  const saved = typeof window !== 'undefined' ? load() : null;
  const [xp, setXp] = useState(saved?.xp ?? 0);
  const [badges, setBadges] = useState(() => new Set(saved?.badges ?? []));
  const [stats, setStats] = useState(saved?.stats ?? {});
  const [toasts, setToasts] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toastId = useRef(0);
  const badgesRef = useRef(badges);
  const xpRef = useRef(xp);
  const statsRef = useRef(stats);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ xp, badges: [...badges], stats }));
    } catch {
      /* storage unavailable: progress lasts for this visit only */
    }
  }, [xp, badges, stats]);

  const pushToast = useCallback((toast) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, ...toast }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), toast.kind === 'badge' ? 4200 : 2200);
  }, []);

  const addXp = useCallback(
    (amount, reason) => {
      const before = levelFor(xpRef.current).level;
      xpRef.current += amount;
      const after = levelFor(xpRef.current);
      setXp(xpRef.current);
      if (after.level > before) setTimeout(() => pushToast({ kind: 'level', title: `Level ${after.level}!`, text: after.title }), 350);
      if (reason) {
        pushToast({ kind: 'xp', title: `+${amount} XP`, text: reason });
        sfx.ding();
      }
    },
    [pushToast],
  );

  const unlock = useCallback(
    (id) => {
      if (badgesRef.current.has(id)) return false;
      const badge = BADGES.find((b) => b.id === id);
      if (!badge) return false;
      badgesRef.current = new Set(badgesRef.current).add(id);
      setBadges(badgesRef.current);
      pushToast({ kind: 'badge', title: 'Badge unlocked!', text: badge.name, badge });
      addXp(40);
      sfx.fanfare();
      import('canvas-confetti')
        .then(({ default: confetti }) => {
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
          confetti({ particleCount: 90, spread: 75, origin: { y: 0.25 }, colors: ['#ffb23f', '#ff6a2b', '#3fd4ff', '#a78bfa'] });
        })
        .catch(() => {});
      return true;
    },
    [addXp, pushToast],
  );

  /** Increment a named counter (e.g. races won) and return the new value. */
  const bump = useCallback((key, by = 1) => {
    const next = (statsRef.current[key] || 0) + by;
    statsRef.current = { ...statsRef.current, [key]: next };
    setStats(statsRef.current);
    return next;
  }, []);

  const setStat = useCallback((key, value) => {
    statsRef.current = { ...statsRef.current, [key]: value };
    setStats(statsRef.current);
  }, []);

  const reset = useCallback(() => {
    xpRef.current = 0;
    badgesRef.current = new Set();
    statsRef.current = {};
    setXp(0);
    setBadges(new Set());
    setStats({});
  }, []);

  const value = useMemo(
    () => ({
      xp,
      level: levelFor(xp),
      badges,
      stats,
      toasts,
      drawerOpen,
      setDrawerOpen,
      addXp,
      unlock,
      bump,
      setStat,
      reset,
      dismissToast: (id) => setToasts((t) => t.filter((x) => x.id !== id)),
    }),
    [xp, badges, stats, toasts, drawerOpen, addXp, unlock, bump, setStat, reset],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
