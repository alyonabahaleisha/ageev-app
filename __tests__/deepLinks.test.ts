jest.mock('../src/lib/firebase', () => ({db: {}}));
jest.mock('firebase/firestore', () => ({doc: jest.fn(), getDoc: jest.fn()}));

import {parseDeepLink} from '../src/services/deepLinks';

describe('parseDeepLink', () => {
  it('parses the story link scheduled by the daily affirmation push', () => {
    expect(parseDeepLink('ageev://story/2026-10-25')).toEqual({
      type: 'story',
      id: '2026-10-25',
    });
  });

  it('still parses library affirmation and content links', () => {
    expect(parseDeepLink('ageev://affirmation/aff_1')).toEqual({
      type: 'affirmation',
      id: 'aff_1',
    });
    expect(parseDeepLink('https://app.agvclub.ru/l/meditation/m%201')).toEqual(
      {type: 'meditation', id: 'm 1'},
    );
  });

  it('rejects unknown types', () => {
    expect(parseDeepLink('ageev://unknown/x')).toBeNull();
  });
});
