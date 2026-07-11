export function getWeekBounds(now = new Date()) {
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

export function getNextMonday(now = new Date()) {
  const day = now.getDay();
  const daysUntil = day === 0 ? 1 : 8 - day;
  const next = new Date(now);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + daysUntil);
  return next;
}
