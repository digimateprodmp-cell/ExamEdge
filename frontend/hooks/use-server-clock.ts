'use client';

import * as React from 'react';
import { liveTestsService } from '@/services/live-tests.service';

/**
 * Fetches the server's clock once and stores the offset from the browser's
 * local clock. Every countdown in the Live Test flow renders from
 * `Date.now() + offset` instead of raw `Date.now()` — real synchronization
 * with the server, without needing a WebSocket.
 */
export function useServerClock() {
  const [offsetMs, setOffsetMs] = React.useState(0);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    liveTestsService
      .serverTime()
      .then(({ serverTime }) => {
        if (cancelled) return;
        setOffsetMs(new Date(serverTime).getTime() - Date.now());
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setReady(true); // fall back to local clock rather than blocking the UI
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const now = React.useCallback(() => new Date(Date.now() + offsetMs), [offsetMs]);

  return { now, offsetMs, ready };
}
