import { useState } from "react";

// Copies the address of one entry, so it can be cited on its own.
export function CopyLink({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = new URL(window.location.href);
    url.hash = id;
    await navigator.clipboard.writeText(url.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" className="copy-link" onClick={copy}>
      <span aria-live="polite">{copied ? "Link copied" : "Copy link to this entry"}</span>
    </button>
  );
}
