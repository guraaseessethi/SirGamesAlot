/** The red d20 that stands in for the "O" in the sign. Decorative: its parent carries the label. */
export function D20({ className, number }: { className?: string; number?: string | number }) {
  return (
    <svg className={className} viewBox="0 0 100 110" aria-hidden="true" focusable="false">
      <polygon points="50,3 96,29 96,81 50,107 4,81 4,29" fill="#d0202e" stroke="#121317" strokeWidth="6" strokeLinejoin="round" />
      <polygon points="50,28 75,72 25,72" fill="none" stroke="#121317" strokeWidth="4" strokeLinejoin="round" />
      <path d="M50 3 L50 28 M96 29 L75 72 M4 29 L25 72 M96 81 L75 72 M4 81 L25 72 M50 107 L75 72 M50 107 L25 72" stroke="#121317" strokeWidth="3" />
      {number !== undefined && (
        <text x="50" y="62" textAnchor="middle" fontFamily="var(--font-archivo-black), Arial Black, sans-serif" fontSize="17" fill="#fff" stroke="#121317" strokeWidth="3" paintOrder="stroke">
          {number}
        </text>
      )}
    </svg>
  );
}
