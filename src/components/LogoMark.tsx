/** Le post-it Carnet Plein : carré vert citron, coin replié, trois lignes de notes. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <path d="M4 3h32v24.5L26.5 37H4z" fill="#d9f879" />
      <path d="M36 27.5L26.5 37v-6.5a3 3 0 0 1 3-3z" fill="#b7d354" />
      <path d="M26.5 37v-6.5a3 3 0 0 1 3-3H36" fill="none" stroke="#9fbd3f" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M4 3h32v24.5L26.5 37H4z" fill="none" stroke="#b7d354" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M11 13h18M11 20h13M11 27h8" stroke="#272727" strokeWidth="2.4" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}
