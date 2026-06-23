export function focusAdminPanelForm(panelId: string) {
  window.requestAnimationFrame(() => {
    const panel = document.getElementById(panelId);
    panel?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    panel?.querySelector<HTMLElement>("input:not([type='hidden']), select, textarea, button")?.focus();
  });
}
