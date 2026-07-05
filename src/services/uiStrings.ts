import {useEffect, useState} from 'react';
import {doc, onSnapshot} from 'firebase/firestore';
import {db} from '../lib/firebase';

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
  onSnapshot(
    doc(db, 'config', 'ui_strings'),
    snap => {
      strings = (snap.data() as Record<string, string>) || {};
      listeners.forEach(l => l());
    },
    err => {
      console.log('FETCHCHECK ui_strings ERROR', err.message);
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
