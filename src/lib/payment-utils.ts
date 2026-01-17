/**
 * Payment Utilities for School Module
 * Handles flexible payment date calculation based on business settings
 */

/**
 * Calculates the next payment date for a student based on the payment mode.
 * 
 * @param enrollmentDate - The date when the student enrolled
 * @param paymentMode - "FIXED_DAY" or "ENROLLMENT_DATE"
 * @param fixedDay - The fixed day of month (1-28) for FIXED_DAY mode
 * @param classDays - Array of class days (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @param referenceMonth - Optional: The month/year to calculate for (defaults to current month)
 * @returns The calculated payment due date
 */
export function calculateNextPaymentDate(
    enrollmentDate: Date,
    paymentMode: "FIXED_DAY" | "ENROLLMENT_DATE",
    fixedDay: number,
    classDays: number[],
    referenceMonth?: Date
): Date {
    const now = referenceMonth || new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (paymentMode === "FIXED_DAY") {
        // Simple: use the fixed day of the current month
        const day = Math.min(fixedDay, getDaysInMonth(year, month));
        return new Date(year, month, day);
    }

    // ENROLLMENT_DATE mode:
    // 1. Get the enrollment day of month
    const enrollmentDayOfMonth = enrollmentDate.getDate();
    const maxDay = getDaysInMonth(year, month);
    const targetDay = Math.min(enrollmentDayOfMonth, maxDay);

    // 2. Create the initial payment date
    let paymentDate = new Date(year, month, targetDay);

    // 3. Check if this day is a class day
    const dayOfWeek = paymentDate.getDay();

    if (classDays.length === 0 || classDays.includes(dayOfWeek)) {
        // It's a class day (or no class schedule specified), use as-is
        return paymentDate;
    }

    // 4. Find the next class day
    return findNextClassDay(paymentDate, classDays);
}

/**
 * Finds the next class day starting from a given date
 */
function findNextClassDay(startDate: Date, classDays: number[]): Date {
    if (classDays.length === 0) return startDate;

    const result = new Date(startDate);

    // Search up to 7 days ahead
    for (let i = 1; i <= 7; i++) {
        result.setDate(result.getDate() + 1);
        if (classDays.includes(result.getDay())) {
            return result;
        }
    }

    // Fallback to original date if no class day found
    return startDate;
}

/**
 * Gets the number of days in a given month
 */
function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Checks if a payment is overdue based on the due date and grace days
 */
export function isPaymentOverdue(
    dueDate: Date,
    graceDays: number = 0
): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueWithGrace = new Date(dueDate);
    dueWithGrace.setDate(dueWithGrace.getDate() + graceDays);
    dueWithGrace.setHours(0, 0, 0, 0);

    return today > dueWithGrace;
}

/**
 * Checks if a payment is due soon (within the next N days)
 */
export function isPaymentDueSoon(
    dueDate: Date,
    daysThreshold: number = 5
): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDateNormalized = new Date(dueDate);
    dueDateNormalized.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((dueDateNormalized.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return diffDays >= 0 && diffDays <= daysThreshold;
}

/**
 * Converts class schedule dayOfWeek values to an array
 * ClassSchedule uses 0=Sunday, 1=Monday, etc. (JavaScript Date convention)
 */
export function extractClassDays(schedules: { dayOfWeek: number }[]): number[] {
    const days = new Set<number>();
    schedules.forEach(s => days.add(s.dayOfWeek));
    return Array.from(days).sort((a, b) => a - b);
}
