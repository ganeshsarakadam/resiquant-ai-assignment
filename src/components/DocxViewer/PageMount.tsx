'use client';

import { useEffect, useRef } from 'react';

/**
 * Mounts a provided HTMLElement into a React-managed div without cloning it.
 * The node is physically moved in the DOM (so original parent loses it) and
 * restored/removed on unmount.
 */
export function PageMount({ node }: { node: HTMLElement }) {
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !node) return;
    host.innerHTML = '';
    host.appendChild(node);
    return () => {
      if (host.contains(node)) host.removeChild(node);
    };
  }, [node]);
  return <div ref={hostRef} className="w-full" />;
}
