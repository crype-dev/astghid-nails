export const appointmentAdvanceMonths = 2;

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateKeyToNoonDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

export function getTodayKey() {
  return toDateKey(new Date());
}

export function getMaxAppointmentDateKey() {
  const maxDate = dateKeyToNoonDate(getTodayKey());
  maxDate.setMonth(maxDate.getMonth() + appointmentAdvanceMonths);
  return toDateKey(maxDate);
}

export function isClosedDay(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 1;
}

export function isWithinAppointmentWindow(date: string) {
  return date >= getTodayKey() && date <= getMaxAppointmentDateKey();
}

export function getInitialAppointmentDateKey() {
  const maxDate = getMaxAppointmentDateKey();
  const current = dateKeyToNoonDate(getTodayKey());

  while (toDateKey(current) <= maxDate) {
    if (!isClosedDay(current)) {
      return toDateKey(current);
    }

    current.setDate(current.getDate() + 1);
  }

  return getTodayKey();
}
