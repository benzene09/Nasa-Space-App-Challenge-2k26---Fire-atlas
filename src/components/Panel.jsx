import { motion } from 'framer-motion';
import { useKids } from '../hooks/useKids';
import { KID_SECTIONS } from '../utils/kidText';
import styles from './Panel.module.css';

/** Glass card used by every dashboard feature. */
export default function Panel({ id, eyebrow, title, description, icon: Icon, actions, children, className = '', delay = 0 }) {
  const { kids } = useKids();
  const kid = kids ? KID_SECTIONS[id] : null;
  if (kid) {
    title = kid.title || title;
    description = kid.desc || description;
    eyebrow = null;
  }
  return (
    <motion.section
      id={id}
      className={`${styles.panel} ${className}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          {Icon && (
            <span className={styles.icon} aria-hidden="true">
              <Icon size={18} strokeWidth={2} />
            </span>
          )}
          <div>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            <h2 id={id ? `${id}-title` : undefined} className={styles.title}>
              {title}
            </h2>
          </div>
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      {description && <p className={styles.description}>{description}</p>}
      <div className={styles.body}>{children}</div>
    </motion.section>
  );
}
