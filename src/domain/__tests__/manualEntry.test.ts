import { parseDurationMinutes, validateManualEntry } from '../manualEntry';

const now = new Date(2026, 10, 7, 9, 41);
const start = new Date(2026, 10, 7, 8, 0);

describe('manual entry validation', () => {
  it('requires a duration of at least one minute', () => {
    const r = validateManualEntry({ durationText: '', caloriesText: '', caloriesOverridden: false, start, now });
    expect(r).toEqual({ ok: false, errors: { duration: 'Duration is required. Enter at least 1 minute.' } });
    expect(validateManualEntry({ durationText: '0', caloriesText: '', caloriesOverridden: false, start, now }).ok).toBe(false);
  });

  it('keeps the estimate unless calories were overridden', () => {
    expect(validateManualEntry({ durationText: '20', caloriesText: '60', caloriesOverridden: false, start, now })).toEqual({
      ok: true,
      durationMinutes: 20,
      caloriesOverride: null,
    });
    expect(validateManualEntry({ durationText: '20', caloriesText: '75', caloriesOverridden: true, start, now })).toEqual({
      ok: true,
      durationMinutes: 20,
      caloriesOverride: 75,
    });
  });

  it('rejects invalid overrides and future start times', () => {
    const r = validateManualEntry({ durationText: '20', caloriesText: '', caloriesOverridden: true, start: new Date(2026, 10, 7, 10, 0), now });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['calories', 'start']);
  });

  it('parses live durations for the estimate', () => {
    expect(parseDurationMinutes('20')).toBe(20);
    expect(parseDurationMinutes('')).toBeNull();
    expect(parseDurationMinutes('601')).toBeNull();
    expect(parseDurationMinutes('2.5')).toBeNull();
  });
});
