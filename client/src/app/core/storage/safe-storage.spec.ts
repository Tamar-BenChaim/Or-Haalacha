import { TestBed } from '@angular/core/testing';

import { SafeStorage } from './safe-storage';

describe('SafeStorage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('reads and writes localStorage', () => {
    const storage = TestBed.inject(SafeStorage);
    storage.setItem('k', 'v');
    expect(localStorage.getItem('k')).toBe('v');
    expect(storage.getItem('k')).toBe('v');
  });

  it('returns null for a missing key and removes keys', () => {
    const storage = TestBed.inject(SafeStorage);
    expect(storage.getItem('missing')).toBeNull();
    storage.setItem('k', 'v');
    storage.removeItem('k');
    expect(storage.getItem('k')).toBeNull();
  });

  it('keeps the value in memory when writing is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const storage = TestBed.inject(SafeStorage);
    storage.setItem('k', 'v');
    expect(storage.getItem('k')).toBe('v');
  });

  it('does not throw when reading or removing is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const storage = TestBed.inject(SafeStorage);
    expect(storage.getItem('k')).toBeNull();
    expect(() => storage.removeItem('k')).not.toThrow();
  });
});
