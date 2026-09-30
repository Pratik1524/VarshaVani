let seq = 0;

/** Unique client-side id for locally created records (crops, messages, alerts). */
export function newId(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}
