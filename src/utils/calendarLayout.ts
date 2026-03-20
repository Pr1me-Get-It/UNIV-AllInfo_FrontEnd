export interface Event {
    id: string;
    summary: string;
    start: { date?: string; dateTime?: string };
    end: { date?: string; dateTime?: string };
    color?: string; // Optional, derived later
    type?: number;  // 0: Undergrad, 1: Grad
}

export interface LayedOutEvent {
    id: string;
    summary: string;
    color: string;
    textColor: string;
    colSpan: number; // Duration in days within the current week row
    slotIndex: number; // Vertical stacking order (0, 1, 2...)
    isContinuedFromLastWeek: boolean;
    isContinuedToNextWeek: boolean;
    startDate: string; // The date this chunk starts on (for this week)
    type?: number;
}

// Helper to get date string YYYY-MM-DD
const getDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const createDate = (ymd: string) => {
    const [y, m, d] = ymd.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d);
};

const addDays = (dateStr: string, days: number) => {
    const d = createDate(dateStr);
    d.setDate(d.getDate() + days);
    return getDateStr(d);
};

const getDayIndex = (dateStr: string) => {
    return createDate(dateStr).getDay(); // 0 (Sun) - 6 (Sat)
};

export const processCalendarEvents = (
    rawEvents: Event[],
    currentMonthStr: string // YYYY-MM (used to optimize processing range if needed)
): Record<string, LayedOutEvent[]> => {
    // 1. Sort events by start date, then length (longer first), then summary
    //    This helps pack events nicely.
    const sortedEvents = [...rawEvents].sort((a, b) => {
        const startA = a.start.date || a.start.dateTime?.split('T')[0] || '';
        const startB = b.start.date || b.start.dateTime?.split('T')[0] || '';
        if (startA !== startB) return startA.localeCompare(startB);

        // Length check (Not strictly necessary but good for heuristics)
        return 0;
    });

    const dateMap: Record<string, LayedOutEvent[]> = {};

    // We process events chunk by chunk per week.
    // Instead of complex week-by-week iteration, we iterate through each event
    // and slice it into weekly segments.

    sortedEvents.forEach((event) => {
        const startStr = event.start.date || event.start.dateTime?.split('T')[0];
        let endStr = event.end?.date || event.end?.dateTime?.split('T')[0] || startStr;

        // Google Calendar API 'end.date' is exclusive, so if it's an all-day event
        // that ends on 2024-02-10, it actually includes up to 2024-02-09.
        // If it has dateTime, it's point-in-time, effectively inclusive for that day.
        // 학사 일정(academic_schedule)의 경우 이미 end.date가 inclusive하므로 변환하지 않습니다.
        const isGoogleAllDay = event.start.date && !event.id.startsWith('knu_');

        if (isGoogleAllDay && event.end?.date) {
            // Adjust exclusive end date for all-day events (Google only)
            const endDateObj = createDate(endStr);
            endDateObj.setDate(endDateObj.getDate() - 1);
            endStr = getDateStr(endDateObj);
        }

        if (!startStr) return;

        let currDate = createDate(startStr);
        const finalEndDate = createDate(endStr);

        // Determine color based on type
        const color = event.type === 1 ? '#F3F4F6' : (event.type === 0 || event.type === 2) ? '#FEE2E2' : '#E3F2FD';
        const textColor = event.type === 1 ? '#111827' : (event.type === 0 || event.type === 2) ? '#b91c1c' : '#0284c7';

        // Split event into weekly chunks
        while (currDate <= finalEndDate) {
            const currDateStr = getDateStr(currDate);
            const dayOfWeek = currDate.getDay(); // 0=Sun, 6=Sat

            // Calculate how many days left in this week (until Saturday)
            const daysLeftInWeek = 7 - dayOfWeek;

            // Calculate how many days left in the event
            const msDiff = finalEndDate.getTime() - currDate.getTime();
            const daysLeftInEvent = Math.floor(msDiff / (1000 * 60 * 60 * 24)) + 1;

            // The span for this chunk is the min of remaining week or remaining event
            const colSpan = Math.min(daysLeftInWeek, daysLeftInEvent);

            // Create the layout object
            const layoutEvent: LayedOutEvent = {
                id: event.id,
                summary: event.summary,
                color,
                textColor,
                colSpan,
                slotIndex: -1, // Assigned later
                isContinuedFromLastWeek: getDateStr(currDate) !== startStr,
                isContinuedToNextWeek: daysLeftInEvent > daysLeftInWeek,
                startDate: currDateStr,
                type: event.type,
            };

            // Register this chunk to the start date of this segment
            if (!dateMap[currDateStr]) {
                dateMap[currDateStr] = [];
            }
            dateMap[currDateStr].push(layoutEvent);

            // Mark occupied slots for this visual row
            // Note: We need a way to check collisions across the days this bar spans.
            // But since we blindly split into weeks, we just need to know
            // "What slots are taken on this specific date?"
            // Ideally, we process day by day or week by week to assign slots.
            // The simple map approach above doesn't know about neighbors' slots yet.

            // Better Approach:
            // Insert into a global "processed" list, then run a slotting pass per day?
            // Or run a slotting pass per week.

            // Let's refine the logic:
            // We stored chunks in dateMap[currDateStr].
            // But we need to know collisions for the whole span.

            // Move to next week state
            currDate.setDate(currDate.getDate() + colSpan);
        }
    });

    // Second Pass: Assign Slots (Collision Detection)
    // We iterate through every day (or effectively every start-of-chunk day).
    const allDates = Object.keys(dateMap).sort();

    // We need a persistent tracker for slots.
    // Since `dateMap` only has the START of chunks, we need to know what's occupying slots on *subsequent* days of those chunks.

    // Map<DateString, boolean[]> -> Date -> [Slot0_Occupied, Slot1_Occupied, ...]
    const occupancy: Record<string, boolean[]> = {};

    allDates.forEach(dateStr => {
        const dayEvents = dateMap[dateStr];

        // Sort events on this day by generic rules (e.g. longer first? or keep original sort?)
        // Original sort (start date) is usually good.

        dayEvents.forEach(ev => {
            // Find first available slot for the *entire duration* of this chunk
            let candidateSlot = 0;
            let found = false;

            while (!found) {
                let collision = false;
                // Check usage for all days this event spans
                for (let i = 0; i < ev.colSpan; i++) {
                    const checkDate = addDays(dateStr, i);
                    if (!occupancy[checkDate]) occupancy[checkDate] = [];

                    if (occupancy[checkDate][candidateSlot]) {
                        collision = true;
                        break;
                    }
                }

                if (!collision) {
                    found = true;
                    ev.slotIndex = candidateSlot;

                    // Mark slots as occupied
                    for (let i = 0; i < ev.colSpan; i++) {
                        const checkDate = addDays(dateStr, i);
                        occupancy[checkDate][candidateSlot] = true;
                    }
                } else {
                    candidateSlot++;
                }
            }
        });
    });

    return dateMap;
};
