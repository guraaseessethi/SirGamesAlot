/** Shows "[verify]" only in ?review=1 mode (CSS in globals.css). Tracks facts in docs/CONTENT_TODO.md. */
export function Verify({ note }: { note?: string }) {
  return (
    <span className="verify" title={note}>
      [verify{note ? `: ${note}` : ''}]
    </span>
  );
}
