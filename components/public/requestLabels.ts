export type RequestMode = 'hold' | 'order' | 'notify';

export function requestDoneLabel(mode: RequestMode, holdHours: number): string {
  if (mode === 'hold') return `Held ${holdHours} h ✓`;
  if (mode === 'order') return 'Requested ✓';
  return "We'll tell you ✓";
}

export function requestIdleLabel(mode: RequestMode): string {
  return mode === 'hold' ? 'Hold it' : mode === 'order' ? 'Order it in' : "Tell me when it's back";
}
