import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareText, Send, Bot, User, FileText, WifiOff } from 'lucide-react';
import { useMission } from '../hooks/useMission';
import { SUGGESTED_QUESTIONS } from '../utils/data';
import { askFireGPT } from '../utils/models';
import Panel from './Panel';
import { useKids } from '../hooks/useKids';
import ModeTabs from './game/ModeTabs';
import FireQuiz from './games/FireQuiz';
import styles from './FireGPT.module.css';

const WELCOME = {
  id: 'welcome',
  role: 'bot',
  text: 'Hi, I am FireGPT. I answer only from indexed NASA PSI and NTRS text, and I cite every source. Ask me about a material, an atmosphere or a gravity level.',
  citations: [],
};

/** F9 — FireGPT chat (RAG stand-in) with streamed answers and citations. */
export default function FireGPT() {
  const { kids } = useKids();
  const [mode, setMode] = useState(kids ? 'play' : 'explore');
  useEffect(() => setMode(kids ? 'play' : 'explore'), [kids]);
  const { phase } = useMission();
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);
  const timers = useRef([]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const ask = (question) => {
    const q = question.trim();
    if (!q || busy) return;
    const id = Date.now();
    setMessages((m) => [...m, { id, role: 'user', text: q }]);
    setInput('');
    setBusy(true);

    const result = askFireGPT(q);
    const words = result.answer.split(' ');
    const botId = id + 1;

    timers.current.push(
      setTimeout(() => {
        setBusy(false);
        setMessages((m) => [...m, { id: botId, role: 'bot', text: '', citations: [], confidence: result.confidence, streaming: true }]);
        words.forEach((_, i) => {
          timers.current.push(
            setTimeout(() => {
              const done = i === words.length - 1;
              setMessages((m) =>
                m.map((msg) =>
                  msg.id === botId ? { ...msg, text: words.slice(0, i + 1).join(' '), citations: done ? result.citations : [], streaming: !done } : msg,
                ),
              );
            }, i * 28),
          );
        });
      }, 700),
    );
  };

  const onSubmit = (e) => {
    e.preventDefault();
    ask(input);
  };

  return (
    <Panel
      id="firegpt"
      icon={MessageSquareText}
      eyebrow="RAG · Chroma + LLM · NTRS API, PSI summaries"
      title="FireGPT"
      description="Ask in plain language. Answers are grounded in NASA text and link to the PSI ID or NTRS report behind them."
      actions={
        <div className="panel-actions">
          <ModeTabs id="firegpt" mode={mode} onChange={setMode} playLabel="Quiz" />
          {mode === 'explore' && (
            <span className={styles.offline}>
              <WifiOff size={14} aria-hidden="true" /> Offline-ready · {phase.commDelay} delay
            </span>
          )}
        </div>
      }
    >
      {mode === 'play' ? (
        <FireQuiz />
      ) : (
        <>
          <div className={styles.chat}>
            <div className={styles.list} ref={listRef} role="log" aria-live="polite" aria-label="FireGPT conversation">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    className={`${styles.msg} ${m.role === 'user' ? styles.user : styles.bot}`}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className={styles.avatar} aria-hidden="true">
                      {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </span>
                    <div className={styles.bubble}>
                      <p>
                        {m.text}
                        {m.streaming && <span className={styles.caret} aria-hidden="true" />}
                      </p>
                      {m.citations?.length > 0 && (
                        <div className={styles.cites}>
                          {m.citations.map((c) => (
                            <span key={c} className={styles.cite}>
                              <FileText size={12} aria-hidden="true" />
                              {c}
                            </span>
                          ))}
                          {typeof m.confidence === 'number' && m.confidence > 0 && (
                            <span className={`${styles.conf} mono`}>{Math.round(m.confidence * 100)}% grounded</span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {busy && (
                  <motion.div key="typing" className={`${styles.msg} ${styles.bot}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <span className={styles.avatar} aria-hidden="true">
                      <Bot size={16} />
                    </span>
                    <div className={`${styles.bubble} ${styles.typing}`} aria-label="FireGPT is searching sources">
                      <span />
                      <span />
                      <span />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className={styles.suggest}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button key={q} type="button" className={styles.suggestBtn} onClick={() => ask(q)} disabled={busy}>
                  {q}
                </button>
              ))}
            </div>

            <form className={styles.form} onSubmit={onSubmit}>
              <label htmlFor="firegpt-input" className="sr-only">
                Ask FireGPT
              </label>
              <input
                id="firegpt-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. Will Nomex burn at 34% O₂ on the Moon?"
                autoComplete="off"
              />
              <button type="submit" className={styles.send} disabled={!input.trim() || busy} aria-label="Send question">
                <Send size={18} />
              </button>
            </form>
          </div>
        </>
      )}
    </Panel>
  );
}
