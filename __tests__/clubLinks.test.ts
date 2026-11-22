jest.mock('../src/lib/firebase', () => ({db: {}}));
jest.mock('firebase/firestore', () => ({collection: jest.fn(), onSnapshot: jest.fn()}));

import {normalizeClubLink} from '../src/services/clubs';

describe('normalizeClubLink', () => {
  it('drops blank and whitespace-only values', () => {
    expect(normalizeClubLink(' ')).toBeUndefined();
    expect(normalizeClubLink('')).toBeUndefined();
    expect(normalizeClubLink(undefined)).toBeUndefined();
  });
  it('trims surrounding spaces', () => {
    expect(normalizeClubLink(' https://t.me/+z2dt2OS7RRlkYmNi')).toBe(
      'https://t.me/+z2dt2OS7RRlkYmNi',
    );
    expect(normalizeClubLink('https://t.me/+0G0J4-FIYOY4Mjdi  ')).toBe(
      'https://t.me/+0G0J4-FIYOY4Mjdi',
    );
  });
  it('repairs a doubled scheme typo', () => {
    expect(normalizeClubLink('htthttps://t.me/+VlwITA91usViMzVi')).toBe(
      'https://t.me/+VlwITA91usViMzVi',
    );
  });
  it('adds https to bare t.me / vk.com links and @handles', () => {
    expect(normalizeClubLink('t.me/clubx')).toBe('https://t.me/clubx');
    expect(normalizeClubLink('vk.com/clubx')).toBe('https://vk.com/clubx');
    expect(normalizeClubLink('@clubx')).toBe('https://t.me/clubx');
  });
  it('keeps valid links as is', () => {
    expect(normalizeClubLink('https://vk.com/clubberdck')).toBe(
      'https://vk.com/clubberdck',
    );
  });
});
