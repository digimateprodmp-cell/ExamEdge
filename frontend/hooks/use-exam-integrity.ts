'use client';

import * as React from 'react';
import { liveTestsService } from '@/services/live-tests.service';
import type { IntegrityPolicyConfig } from '@/types';

const DEFAULT_BLOCKED_COMBOS = ['ctrl+c', 'ctrl+v', 'ctrl+p', 'ctrl+shift+i', 'f12'];

function normalizeCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('ctrl');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');
  parts.push(e.key.toLowerCase());
  return parts.join('+');
}

/**
 * Attaches keyboard/visibility/blur monitoring ONLY on the live exam route.
 * It never counts its own violations — every matched event is POSTed to the
 * server, which returns the action (LOGGED/WARNING/TERMINATED) to render.
 * The client is a display layer for a server-side decision, nothing more.
 */
export function useExamIntegrity(
  accessToken: string | null,
  liveTestAttemptId: string | null,
  config: IntegrityPolicyConfig | null,
  active: boolean,
  onTerminated: () => void,
) {
  const [warningCount, setWarningCount] = React.useState(0);
  const [pendingWarning, setPendingWarning] = React.useState<string | null>(null);

  const report = React.useCallback(
    async (eventType: string, keyCombination?: string) => {
      if (!accessToken || !liveTestAttemptId) return;
      try {
        const result = await liveTestsService.recordIntegrityEvent(accessToken, liveTestAttemptId, {
          eventType,
          keyCombination,
          browserInfo: navigator.userAgent,
        });
        setWarningCount(result.warningCount);
        if (result.action === 'WARNING') {
          setPendingWarning(
            `Warning: ${eventType.replaceAll('_', ' ').toLowerCase()} detected. One more violation will end your attempt.`,
          );
        } else if (result.action === 'TERMINATED') {
          onTerminated();
        }
      } catch {
        // Network hiccup reporting the event; the server-side sweep and the
        // next successful report still keep the true violation count.
      }
    },
    [accessToken, liveTestAttemptId, onTerminated],
  );

  React.useEffect(() => {
    if (!active) return;

    const blockedCombos = new Set(
      (config?.blockedShortcuts?.length ? config.blockedShortcuts : DEFAULT_BLOCKED_COMBOS).map((c) =>
        c.toLowerCase(),
      ),
    );

    const handleKeydown = (e: KeyboardEvent) => {
      const combo = normalizeCombo(e);
      if (blockedCombos.has(combo)) {
        e.preventDefault();
        report('BLOCKED_SHORTCUT', combo);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        report('TAB_SWITCH');
      }
    };

    const handleBlur = () => {
      report('WINDOW_BLUR');
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (config?.blockTextSelection) e.preventDefault();
    };

    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [active, config, report]);

  const acknowledgeWarning = React.useCallback(() => setPendingWarning(null), []);

  return { warningCount, pendingWarning, acknowledgeWarning };
}
