import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dir = path.join(root, "assets", "images", "figma-previews");
fs.mkdirSync(dir, { recursive: true });

function esc(t) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function svg(lines) {
  const title = lines.join(" ");
  const e = esc(title);
  const line1 = esc(lines[0] || "");
  const line2 = esc(
    lines.slice(1).join(" · ") || "Replace this file or point preview_src to your export"
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" role="img" aria-label="${e}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e8eaed" />
      <stop offset="100%" style="stop-color:#dadce0" />
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#g)" />
  <text x="400" y="200" text-anchor="middle" fill="#5f6368" font-family="system-ui,Segoe UI,sans-serif" font-size="17" font-weight="600">${line1}</text>
  <text x="400" y="240" text-anchor="middle" fill="#80868b" font-family="system-ui,Segoe UI,sans-serif" font-size="13">${line2}</text>
  <text x="400" y="275" text-anchor="middle" fill="#9aa0a6" font-family="system-ui,Segoe UI,sans-serif" font-size="12">Replace with PNG/WebP export — keep path or update preview_src in the include.</text>
</svg>
`;
}

const samples = [
  ["curated-friction-onboarding.svg", ["Figma preview sample", "_includes/curated-product/panel-friction.md · Onboarding (4001-46385)"]],
  ["curated-friction-onboarding-revised.svg", ["Figma preview sample", "_includes/curated-product/panel-friction.md · Onboarding revised (4001-46681)"]],
  ["curated-content-distress-management.svg", ["Figma preview sample", "_includes/curated-product/panel-content-delivery.md · Distress management (1-17403)"]],
  ["curated-design-best-practice-analysis.svg", ["Figma preview sample", "panel-design-process.md · Treatment plan best practice (4038-83822)"]],
  ["curated-design-treatment-diagrams.svg", ["Figma preview sample", "panel-design-process.md · Treatment plan diagrams (1-17403)"]],
  ["curated-design-treatment-wireframes.svg", ["Figma preview sample", "panel-design-process.md · Treatment plan wireframes (4003-11949)"]],
  ["curated-design-treatment-screens.svg", ["Figma preview sample", "panel-design-process.md · Treatment plan screens (1-17403)"]],
  ["post-vhp-incubator-design-system.svg", ["Figma preview sample", "_posts/2021-09-01-VHP_Support.md · Incubator design system (14-42700)"]],
  ["post-mika-app-arch-selection-10-6593.svg", ["Figma preview sample", "_posts/2022-01-01-Mika_App_Arch.md · Project selection (10-6593)"]],
  ["post-mika-app-arch-selection-4-6589.svg", ["Figma preview sample", "_posts/2022-01-01-Mika_App_Arch.md · Project selection (4-6589)"]],
  ["post-myths-project-selection-10-6592.svg", ["Figma preview sample", "_posts/2021-01-06-Myths_Behind_Stars.md · Project selection (10-6592)"]],
  ["archive-mika-regulatory-flows-46-15248.svg", ["Figma preview sample", "_archive/Mika_Regulatory_Rehaul.md · Onboarding flows (46-15248)"]],
  ["archive-mika-regulatory-flows-48-40848.svg", ["Figma preview sample", "_archive/Mika_Regulatory_Rehaul.md · Onboarding flows (48-40848)"]],
  ["post-mika-ds-overview-2-54414.svg", ["Figma preview sample", "_posts/2023-12-01-Mika_Design_System.md · Design system (2-54414)"]],
  ["post-mika-ds-components-2-14322.svg", ["Figma preview sample", "_posts/2023-12-01-Mika_Design_System.md · Design system components (2-14322)"]],
  ["post-mika-feature-distress-tracking.svg", ["Figma preview sample", "_posts/2022-09-01-Mika_Feature_Development.md · Distress tracking (56-17766)"]],
  ["post-mika-feature-distress-management.svg", ["Figma preview sample", "_posts/2022-09-01-Mika_Feature_Development.md · Distress management (56-18170)"]],
  ["post-mika-feature-treatment-management.svg", ["Figma preview sample", "_posts/2022-09-01-Mika_Feature_Development.md · Treatment management (56-34324)"]],
  ["post-mika-feature-treatment-adherence.svg", ["Figma preview sample", "_posts/2022-09-01-Mika_Feature_Development.md · Treatment support and adherence (56-23601)"]],
];

for (const [name, lines] of samples) {
  fs.writeFileSync(path.join(dir, name), svg(lines), "utf8");
}

console.log("wrote", samples.length, "files to assets/images/figma-previews/");
