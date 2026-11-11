import { describe, expect, it } from 'vitest';
import { rollAnnouncement, rollD20, rollMessage } from './d20';

describe('d20', () => {
  it('rolls 1 to 20 inclusive', () => {
    expect(rollD20(() => 0)).toBe(1);
    expect(rollD20(() => 0.9999)).toBe(20);
    expect(rollD20(() => 0.5)).toBe(11);
  });
  it('has a message for every outcome', () => {
    expect(rollMessage(20)).toContain('Natural 20');
    expect(rollMessage(15)).toContain('Better than the sure 10%');
    expect(rollMessage(10)).toContain('Exactly 10%');
    expect(rollMessage(1)).toContain('natural 1');
    expect(rollMessage(4)).toContain('sure 10% would have won');
  });
  it('announces the number for screen readers', () => {
    expect(rollAnnouncement(7)).toMatch(/^You rolled 7\./);
  });
});
