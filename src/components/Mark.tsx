// The site's own mark: a ledger page with its ruled margin.
export function Mark() {
  return (
    <svg className="mark" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor">
      <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="2" strokeWidth="1.5" />
      <path d="M7.75 3v18M10 3v18" strokeWidth="1" />
      <path d="M13 8.5h5M13 12h5M13 15.5h5" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
