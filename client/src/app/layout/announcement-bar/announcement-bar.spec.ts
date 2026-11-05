import { TestBed } from '@angular/core/testing';

import { AnnouncementBar } from './announcement-bar';

function render(message: string | null) {
  const fixture = TestBed.createComponent(AnnouncementBar);
  fixture.componentRef.setInput('message', message);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('AnnouncementBar', () => {
  it('renders nothing when there is no message', () => {
    expect(render(null).querySelector('.bar')).toBeNull();
  });

  it('shows the message as text', () => {
    const el = render('משלוח חינם מעל 300 ₪');
    expect(el.querySelector('.bar')!.textContent).toContain('משלוח חינם מעל 300 ₪');
  });

  it('does not interpret markup in the message', () => {
    const el = render('<img src=x onerror=alert(1)>');
    expect(el.querySelector('img')).toBeNull();
  });
});
