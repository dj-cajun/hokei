import net from "net";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 5432;
const MAX_ATTEMPTS = 30;
const INTERVAL_MS = 1000;

export async function waitForPostgres(
  host = DEFAULT_HOST,
  port = DEFAULT_PORT
): Promise<void> {
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    const ok = await tryConnect(host, port);
    if (ok) {
      console.log(`[wait] PostgreSQL ready (${host}:${port})`);
      return;
    }
    console.log(`[wait] PostgreSQL 대기 중… (${i}/${MAX_ATTEMPTS})`);
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
  throw new Error(
    `PostgreSQL에 연결할 수 없습니다 (${host}:${port}). docker compose ps 로 확인하세요.`
  );
}

function tryConnect(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    socket.setTimeout(2000);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}
