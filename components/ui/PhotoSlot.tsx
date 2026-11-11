import Image from 'next/image';
import styles from './PhotoSlot.module.css';

export interface PhotoSlotProps {
  /** Path under /public once the owner supplies a photo, e.g. "/images/storefront.jpg". */
  src?: string;
  alt: string;
  /** What to ask the owner for. Shown in the placeholder. */
  label: string;
  width: number;
  height: number;
}

/**
 * A slot for an owner-supplied photo. Until `src` is set it shows a clearly labelled placeholder,
 * so nobody mistakes it for a finished page and no one else's artwork is ever used.
 * Sizes and the shot list live in public/images/README.md.
 */
export function PhotoSlot({ src, alt, label, width, height }: PhotoSlotProps) {
  if (src) {
    return <Image className={styles.img} src={src} alt={alt} width={width} height={height} sizes="(max-width: 860px) 100vw, 560px" />;
  }
  return (
    <div className={styles.slot} style={{ aspectRatio: `${width} / ${height}` }} role="img" aria-label={`Photo placeholder: ${label}`}>
      <span className={styles.tag}>Photo slot</span>
      <span className={styles.label}>{label}</span>
      <span className={styles.size}>
        {width} × {height}
      </span>
    </div>
  );
}
