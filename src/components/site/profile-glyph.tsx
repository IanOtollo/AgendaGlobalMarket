/** Neutral profile icon (head and shoulders) used wherever a professional has no uploaded photo. */
export function ProfileGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden>
      <circle cx="32" cy="23" r="11" />
      <path d="M10 64c0-14 9.8-24 22-24s22 10 22 24z" />
    </svg>
  );
}
