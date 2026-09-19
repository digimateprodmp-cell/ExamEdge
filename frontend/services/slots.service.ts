import { apiFetch } from '@/lib/api';
import type { SlotBooking, TestSlot } from '@/types';

export const slotsService = {
  listForLiveTest: (liveTestId: string) =>
    apiFetch<TestSlot[]>(`/live-tests/${liveTestId}/slots`),

  myBookings: (token: string) => apiFetch<SlotBooking[]>('/bookings/mine', { token }),

  reserveOrBook: (token: string, slotId: string) =>
    apiFetch<{ requiresPayment: boolean; booking?: unknown; reservation?: { id: string } }>(
      `/slots/${slotId}/reserve`,
      { method: 'POST', token },
    ),
};
