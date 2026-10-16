/** Le symbole Vision : un œil sur un carré vert citron. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="36" height="36" rx="11" fill="#d9f879" stroke="#b7d354" strokeWidth="1.2" />
      <path d="M8 20C13 11.5 27 11.5 32 20C27 28.5 13 28.5 8 20Z" fill="#fffefa" stroke="#272727" strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="4.8" fill="#272727" />
      <circle cx="21.7" cy="18.3" r="1.4" fill="#d9f879" />
    </svg>
  );
}
