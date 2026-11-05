import { Pipe, PipeTransform } from '@angular/core';

const whole = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});
const withAgorot = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  minimumFractionDigits: 2,
});

/**
 * Display only: formats an integer amount in agorot (6500 -> "65 ₪").
 * Never use it for calculations; totals always come from the server.
 */
@Pipe({ name: 'agorotToShekels' })
export class AgorotToShekels implements PipeTransform {
  transform(agorot: number | null | undefined): string {
    if (typeof agorot !== 'number' || !Number.isSafeInteger(agorot)) {
      return '';
    }
    const format = agorot % 100 === 0 ? whole : withAgorot;
    return format.format(agorot / 100);
  }
}
