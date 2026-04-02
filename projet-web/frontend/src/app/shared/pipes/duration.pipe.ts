export class DurationPipe {
  // Transforms milliseconds to mm:ss string
  transform(ms: number): string {
    if (!ms && ms !== 0) return '--:--';
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60).toString().padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}
