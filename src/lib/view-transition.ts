// Card -> profile morph using the View Transitions API (progressive enhancement: other browsers navigate normally).
type VT = Document & { startViewTransition?: (cb: () => Promise<void> | void) => { finished: Promise<void> } };

export function navigateWithTransition(e: React.MouseEvent<HTMLElement>, href: string, push: (href: string) => void, sourceSelector = "[data-vt-source]") {
  const doc = document as VT;
  const modified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
  if (modified || !doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // normal link behaviour
  e.preventDefault();
  const source = e.currentTarget.querySelector<HTMLElement>(sourceSelector);
  if (source) source.style.setProperty("view-transition-name", "pro-hero");
  const t = doc.startViewTransition(async () => {
    push(href);
    // Wait until the new page is in place (or give up after a second) so the browser can morph card -> hero.
    const start = performance.now();
    while (location.pathname !== href && performance.now() - start < 1000) await new Promise((r) => requestAnimationFrame(r));
    source?.style.removeProperty("view-transition-name");
    await new Promise((r) => setTimeout(r, 60));
  });
  t.finished.finally(() => source?.style.removeProperty("view-transition-name"));
}
