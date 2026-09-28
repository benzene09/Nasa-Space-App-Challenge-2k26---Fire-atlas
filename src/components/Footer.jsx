import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p>
        FlameAtlas · NASA Space Apps Challenge 2026 — <em>Flame in Freefall</em>
      </p>
      <p className={styles.note}>Demo build with simulated models and dummy data. Not for flight decisions.</p>
    </footer>
  );
}
