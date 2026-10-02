import { useState } from "react";

const LABEL = {
  idle: "Copy link",
  copied: "Link copied",
  // The link itself still worked: following it puts the address in the address bar.
  blocked: "Link is in the address bar",
};

// A link to one entry, so it can be cited on its own. Following it also copies the address.
export function CopyLink({ id }: { id: string }) {
  const [state, setState] = useState<keyof typeof LABEL>("idle");

  function copy() {
    const url = new URL(window.location.href);
    url.hash = id;
    navigator.clipboard.writeText(url.href).then(() => setState("copied"), () => setState("blocked"));
    window.setTimeout(() => setState("idle"), 2500);
  }

  return (
    <a className="copy-link" href={`#${id}`} onClick={copy}>
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M6.75 9.25a3 3 0 0 0 4.24 0l2.13-2.13a3 3 0 0 0-4.25-4.24l-.87.87" />
        <path d="M9.25 6.75a3 3 0 0 0-4.24 0L2.88 8.88a3 3 0 0 0 4.25 4.24l.87-.87" />
      </svg>
      <span aria-live="polite">{LABEL[state]}</span>
    </a>
  );
}
