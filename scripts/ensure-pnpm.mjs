import { unlinkSync } from "node:fs";

for (const f of ["package-lock.json", "yarn.lock"]) {
  try {
    unlinkSync(f);
  } catch {
    /* ignore */
  }
}

const ua = process.env.npm_config_user_agent ?? "";
if (ua) {
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
