import { TestBed } from '@angular/core/testing';

import { Share } from './share';

const page = { url: 'https://example.org/book/a', title: 'ספר' };

function setNavigator(value: Partial<Navigator>) {
  vi.stubGlobal('navigator', value);
}

describe('Share', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses the share sheet when the device has one', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator({ share });
    expect(await TestBed.inject(Share).share(page)).toBe('shared');
    expect(share).toHaveBeenCalledWith(page);
  });

  it('copies the link when there is no share sheet', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setNavigator({ clipboard: { writeText } as unknown as Clipboard });
    expect(await TestBed.inject(Share).share(page)).toBe('copied');
    expect(writeText).toHaveBeenCalledWith(page.url);
  });

  it('copies the link when sharing fails for a technical reason', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setNavigator({
      share: vi.fn().mockRejectedValue(new Error('not allowed')),
      clipboard: { writeText } as unknown as Clipboard,
    });
    expect(await TestBed.inject(Share).share(page)).toBe('copied');
  });

  it('does nothing more when the person closes the share sheet', async () => {
    const writeText = vi.fn();
    setNavigator({
      share: vi.fn().mockRejectedValue(new DOMException('closed', 'AbortError')),
      clipboard: { writeText } as unknown as Clipboard,
    });
    expect(await TestBed.inject(Share).share(page)).toBe('failed');
    expect(writeText).not.toHaveBeenCalled();
  });

  it('reports a failure when copying is not possible either', async () => {
    setNavigator({ clipboard: { writeText: vi.fn().mockRejectedValue(new Error('no')) } as never });
    expect(await TestBed.inject(Share).share(page)).toBe('failed');
  });
});
