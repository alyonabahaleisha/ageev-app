import {useEffect, useState} from 'react';
import {doc} from 'firebase/firestore';
import {db} from '../lib/firebase';
import {subscribeCachedDoc} from './contentCache';

// Live copy of the CMS-editable UI texts (config/ui_strings in Firestore,
// edited on the admin "UI тексты" page). Keys missing from the doc fall back
// to the defaults passed at each call site.
let strings: Record<string, string> = {};
let started = false;
const listeners = new Set<() => void>();

function ensureStarted() {
  if (started) {
    return;
  }
  started = true;
  subscribeCachedDoc<Record<string, string>>(
    'ui_strings',
    doc(db, 'config', 'ui_strings'),
    data => {
      strings = data || {};
      listeners.forEach(l => l());
    },
  );
}

export function uiString(key: string, fallback: string): string {
  const value = strings[key];
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : fallback;
}

export function useUIStrings() {
  const [, setTick] = useState(0);
  useEffect(() => {
    ensureStarted();
    const listener = () => setTick(t => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return uiString;
}
