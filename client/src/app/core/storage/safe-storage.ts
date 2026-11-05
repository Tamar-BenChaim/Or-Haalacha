import { Injectable } from '@angular/core';

/**
 * localStorage that never throws. It can be blocked (private mode, site settings),
 * full, or missing. When writing fails the value is kept in memory for this visit.
 */
@Injectable({ providedIn: 'root' })
export class SafeStorage {
  private readonly memory = new Map<string, string>();

  getItem(key: string): string | null {
    const inMemory = this.memory.get(key);
    if (inMemory !== undefined) {
      return inMemory;
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
      this.memory.delete(key);
    } catch {
      this.memory.set(key, value);
    }
  }

  removeItem(key: string): void {
    this.memory.delete(key);
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing to remove if storage is unavailable.
    }
  }
}
