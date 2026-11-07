import { describe, expect, it } from 'vitest';
import { availableAreas, MIXED_ID } from './areas';

describe('availableAreas', () => {
  it('offers only areas with enabled stages, limited to those stages', () => {
    const areas = availableAreas([2, 5]);
    expect(areas.map((a) => [a.id, a.stages])).toEqual([
      ['silben', [2]],
      ['gruppen', [5]],
      [MIXED_ID, [2, 5]],
    ]);
  });

  it('adds no mixed area when only one area is available', () => {
    expect(availableAreas([1, 2]).map((a) => a.id)).toEqual(['silben']);
  });

  it('returns nothing when no stage is enabled', () => {
    expect(availableAreas([])).toEqual([]);
  });
});
