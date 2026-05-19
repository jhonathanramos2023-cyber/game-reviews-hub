import { unlinkSync } from "node:fs";

for (const f of ["package-lock.json", "yarn.lock"]) {
  try {
    unlinkSync(f);
  } catch {
    /* ignore */
  }
}

// Render runs `npm install` at the repo root before the build command; allow it.
const onRender = Boolean(process.env.RENDER);

const ua = process.env.npm_config_user_agent ?? "";
if (!onRender && ua) {
  const l = ua.toLowerCase();
  if (l.includes("yarn")) {
    console.error("Use pnpm instead");
    process.exit(1);
  }
  if (/^npm\//i.test(ua) && !l.includes("pnpm")) {
    console.error("Use pnpm instead");
    process.exit(1);
  }
}
