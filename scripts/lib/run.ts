import { execSync } from "child_process";

export function run(cmd: string, env: Record<string, string> = {}) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, {
    stdio: "inherit",
    env: { ...process.env, ...env },
    cwd: process.cwd(),
  });
}
