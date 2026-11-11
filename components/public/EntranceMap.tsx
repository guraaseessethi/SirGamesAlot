import { Verify } from '@/components/ui/Verify';
import styles from './Visit.module.css';

/**
 * A simple diagram, drawn for this site, instead of a map screenshot.
 * The numbered steps below the picture carry the same directions in text.
 */
export function EntranceMap() {
  return (
    <figure className={styles.map} id="entrance">
      <svg viewBox="0 0 320 190" role="img" aria-labelledby="entrance-title entrance-desc">
        <title id="entrance-title">
          Diagram: how to reach Sir Games-A-Lot while the main doors are closed
        </title>
        <desc id="entrance-desc">
          The main Bayfield Street doors are closed for construction. Enter from the Coulter Street
          side, go to the lower level, and the store is near Bowlerama and Service Ontario.
        </desc>
        <rect
          x="40"
          y="20"
          width="236"
          height="132"
          fill="#fff8e1"
          stroke="#121317"
          strokeWidth="3"
        />
        <text
          x="158"
          y="40"
          textAnchor="middle"
          fontFamily="var(--font-archivo), sans-serif"
          fontWeight="800"
          fontSize="11"
          fill="#555b68"
        >
          BAYFIELD MALL · LOWER LEVEL
        </text>
        <rect
          x="0"
          y="162"
          width="290"
          height="24"
          fill="#e8e9ee"
          stroke="#121317"
          strokeWidth="2"
        />
        <text
          x="145"
          y="178"
          textAnchor="middle"
          fontFamily="var(--font-archivo), sans-serif"
          fontWeight="800"
          fontSize="10"
          fill="#121317"
        >
          BAYFIELD ST
        </text>
        <rect
          x="290"
          y="0"
          width="28"
          height="186"
          fill="#e8e9ee"
          stroke="#121317"
          strokeWidth="2"
        />
        <text
          x="305"
          y="92"
          textAnchor="middle"
          fontFamily="var(--font-archivo), sans-serif"
          fontWeight="800"
          fontSize="10"
          fill="#121317"
          transform="rotate(90 305 92)"
        >
          COULTER ST
        </text>
        <g transform="translate(158 152)">
          <line x1="-11" y1="-9" x2="11" y2="9" stroke="#d0202e" strokeWidth="5" />
          <line x1="11" y1="-9" x2="-11" y2="9" stroke="#d0202e" strokeWidth="5" />
        </g>
        <text
          x="158"
          y="134"
          textAnchor="middle"
          fontFamily="var(--font-archivo), sans-serif"
          fontWeight="800"
          fontSize="11"
          fill="#d0202e"
        >
          MAIN DOORS CLOSED
        </text>
        <defs>
          <marker
            id="entrance-arrow"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="4"
            orient="auto"
          >
            <path d="M0 0 L8 4 L0 8 Z" fill="#17724a" />
          </marker>
        </defs>
        <path d="M288 80 H266" stroke="#17724a" strokeWidth="5" markerEnd="url(#entrance-arrow)" />
        <text
          x="246"
          y="103"
          textAnchor="middle"
          fontFamily="var(--font-archivo), sans-serif"
          fontWeight="800"
          fontSize="11"
          fill="#17724a"
        >
          ENTER HERE
        </text>
        <rect
          x="106"
          y="62"
          width="104"
          height="38"
          fill="#1f3f99"
          stroke="#121317"
          strokeWidth="3"
        />
        <text
          x="158"
          y="86"
          textAnchor="middle"
          fontFamily="var(--font-archivo-black), sans-serif"
          fontSize="11"
          fill="#f6c431"
        >
          SIR GAMES-A-LOT
        </text>
        <rect x="52" y="104" width="44" height="22" fill="#fff" stroke="#121317" strokeWidth="2" />
        <text
          x="74"
          y="119"
          textAnchor="middle"
          fontFamily="var(--font-archivo), sans-serif"
          fontWeight="700"
          fontSize="8"
          fill="#121317"
        >
          Bowlerama
        </text>
        <rect x="220" y="104" width="50" height="22" fill="#fff" stroke="#121317" strokeWidth="2" />
        <text
          x="245"
          y="114"
          textAnchor="middle"
          fontFamily="var(--font-archivo), sans-serif"
          fontWeight="700"
          fontSize="7.5"
          fill="#121317"
        >
          Service
        </text>
        <text
          x="245"
          y="122"
          textAnchor="middle"
          fontFamily="var(--font-archivo), sans-serif"
          fontWeight="700"
          fontSize="7.5"
          fill="#121317"
        >
          Ontario
        </text>
      </svg>
      <figcaption>
        <ol className={styles.steps}>
          <li>The main Bayfield Street doors are closed for construction.</li>
          <li>Use the Coulter Street entrance on the side of the mall.</li>
          <li>Head to the lower level. We&apos;re next to Bowlerama and Service Ontario.</li>
        </ol>
        <Verify note="Coulter Street entrance directions and construction dates" />
      </figcaption>
    </figure>
  );
}
