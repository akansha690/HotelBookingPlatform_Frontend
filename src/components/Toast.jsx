export function showToast(message, type = "info") {
  let container = document.getElementById("toast-root");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-root";
    container.style.cssText =
      "position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;";
    document.body.appendChild(container);
  }

  const cfg = {
    success: { bg: "#F0FDF4", border: "#86EFAC", icon: "✓", ic: "#16A34A", tc: "#166534" },
    error:   { bg: "#FEF2F2", border: "#FCA5A5", icon: "✕", ic: "#DC2626", tc: "#991B1B" },
    info:    { bg: "#EDE9FE", border: "#C4B5FD", icon: "i", ic: "#7C3AED", tc: "#5B21B6" },
  }[type] || { bg: "#EDE9FE", border: "#C4B5FD", icon: "i", ic: "#7C3AED", tc: "#5B21B6" };

  const t = document.createElement("div");
  t.style.cssText = `
    pointer-events:all;display:flex;align-items:center;gap:10px;
    background:${cfg.bg};border:1px solid ${cfg.border};border-radius:12px;
    padding:12px 16px;font-size:13px;color:${cfg.tc};
    max-width:340px;min-width:260px;font-family:system-ui,sans-serif;
    box-shadow:0 4px 16px rgba(124,58,237,0.12);
    animation:toastIn .2s ease;
  `;
  t.innerHTML = `
    <span style="width:20px;height:20px;border-radius:50%;background:${cfg.ic};color:#fff;
      display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">
      ${cfg.icon}
    </span>
    <span style="flex:1;line-height:1.45;">${message}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;
      cursor:pointer;color:#9CA3AF;font-size:18px;line-height:1;padding:0;flex-shrink:0;">×</button>
  `;

  if (!document.getElementById("toast-style")) {
    const s = document.createElement("style");
    s.id = "toast-style";
    s.textContent = `@keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}`;
    document.head.appendChild(s);
  }

  container.appendChild(t);
  setTimeout(() => t?.remove(), 4500);
}

export default function Toast() { return null; }
