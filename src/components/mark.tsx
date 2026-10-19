export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" fill="#1c3144" />
      <rect x="2.25" y="2.25" width="27.5" height="27.5" fill="none" stroke="#f4f0e6" strokeWidth="0.6" opacity="0.45" />
      <path d="M8 11.2h16M10.2 15.1h11.6" stroke="#f4f0e6" strokeWidth="1.35" />
      <path d="M11.2 18.4 16 24.8l4.8-6.4" stroke="#f4f0e6" strokeWidth="1.35" fill="none" />
    </svg>
  );
}
