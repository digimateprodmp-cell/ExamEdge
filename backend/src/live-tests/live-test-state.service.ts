import { Injectable } from '@nestjs/common';
import { LiveTestStatus } from '@prisma/client';

export interface LiveTestScheduleLike {
  startAt: Date;
  endAt: Date;
  status: LiveTestStatus;
  resultVisibility: 'IMMEDIATE' | 'MANUAL' | 'SCHEDULED';
  resultVisibleAt: Date | null;
}

const COUNTDOWN_LEAD_MS = 60 * 60 * 1000;

/**
 * Pure function: recomputes the live status from server `now`, never a
 * possibly-stale DB column. CANCELLED is a terminal admin override and is
 * never recomputed away.
 */
@Injectable()
export class LiveTestStateService {
  computeStatus(
    liveTest: LiveTestScheduleLike,
    now: Date = new Date(),
  ): LiveTestStatus {
    if (liveTest.status === LiveTestStatus.CANCELLED) {
      return LiveTestStatus.CANCELLED;
    }

    if (now < new Date(liveTest.startAt.getTime() - COUNTDOWN_LEAD_MS)) {
      return LiveTestStatus.UPCOMING;
    }
    if (now < liveTest.startAt) {
      return LiveTestStatus.COUNTDOWN;
    }
    if (now <= liveTest.endAt) {
      return LiveTestStatus.LIVE;
    }

    if (liveTest.resultVisibility === 'IMMEDIATE') {
      return LiveTestStatus.RESULTS_AVAILABLE;
    }
    if (
      liveTest.resultVisibility === 'SCHEDULED' &&
      liveTest.resultVisibleAt &&
      now >= liveTest.resultVisibleAt
    ) {
      return LiveTestStatus.RESULTS_AVAILABLE;
    }
    return LiveTestStatus.ENDED;
  }

  canJoin(
    liveTest: {
      startAt: Date;
      endAt: Date;
      allowLateEntry: boolean;
      lateEntryCutoffAt: Date | null;
      status: LiveTestStatus;
    },
    now: Date = new Date(),
  ): boolean {
    if (liveTest.status === LiveTestStatus.CANCELLED) return false;
    if (now < new Date(liveTest.startAt.getTime() - COUNTDOWN_LEAD_MS)) {
      return false;
    }
    if (now < liveTest.startAt) return true; // countdown/waiting room
    const cutoff = liveTest.allowLateEntry
      ? (liveTest.lateEntryCutoffAt ?? liveTest.endAt)
      : liveTest.startAt;
    return now <= cutoff && now <= liveTest.endAt;
  }
}
