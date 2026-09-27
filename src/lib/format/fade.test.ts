import { describe, expect, it } from 'vitest';

import { fadeShare } from './fade';

describe('fadeShare', () => {
  it('reads the fade of a knife from its pattern', () => {
    expect(fadeShare('★ Karambit | Fade (Factory New)', 412)).toEqual({
      percentage: 100,
      ranking: 1,
    });
  });

  it('skips finishes without a fade and unknown patterns', () => {
    expect(fadeShare('★ Karambit | Marble Fade (Factory New)', 412)).toBeNull();
    expect(fadeShare('AK-47 | Redline (Field-Tested)', 412)).toBeNull();
    expect(fadeShare('★ Karambit | Fade (Factory New)', null)).toBeNull();
  });
});
