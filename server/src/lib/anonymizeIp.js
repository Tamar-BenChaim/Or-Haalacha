import { isIPv4, isIPv6 } from 'node:net';

/**
 * Truncates an IP address so it cannot identify a single person:
 * IPv4 keeps the first three octets (/24), IPv6 the first three groups (/48).
 */
export function anonymizeIp(ip) {
  if (typeof ip !== 'string') return null;

  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  const address = mapped ? mapped[1] : ip;

  if (isIPv4(address)) {
    return address.split('.').slice(0, 3).concat('0').join('.');
  }
  if (isIPv6(address)) {
    return `${expandIPv6(address).slice(0, 3).join(':')}::`;
  }
  return null;
}

function expandIPv6(address) {
  const [head, tail = ''] = address.split('::');
  const headGroups = head ? head.split(':') : [];
  const tailGroups = tail ? tail.split(':') : [];
  const missing = address.includes('::') ? 8 - headGroups.length - tailGroups.length : 0;
  return [...headGroups, ...Array(missing).fill('0'), ...tailGroups].map(
    (group) => group.replace(/^0+(?=.)/, '').toLowerCase() || '0',
  );
}
