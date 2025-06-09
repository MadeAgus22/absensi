type ShiftTimeSettings = {
  checkInStart: string
  checkInEnd: string
  checkOutStart: string
  checkOutEnd: string
  overtimeThreshold: string
}

type TimeSettings = {
  Reguler: ShiftTimeSettings
  Pagi: ShiftTimeSettings
  Siang: ShiftTimeSettings
  Malam: ShiftTimeSettings
}

export function calculateAttendanceStatus(
  checkInTime: string,
  checkOutTime: string,
  shift: keyof TimeSettings,
  timeSettings: TimeSettings,
) {
  const shiftSettings = timeSettings[shift]

  // Parse times
  const checkIn = new Date(`2000-01-01T${checkInTime}`)
  const checkOut = new Date(`2000-01-01T${checkOutTime}`)
  const checkInEndLimit = new Date(`2000-01-01T${shiftSettings.checkInEnd}`)
  const overtimeThreshold = new Date(`2000-01-01T${shiftSettings.overtimeThreshold}`)

  // For night shift, handle day crossing for check-out
  if (shift === "Malam") {
    const checkOutNext = new Date(`2000-01-02T${checkOutTime}`)
    const overtimeThresholdNext = new Date(`2000-01-02T${shiftSettings.overtimeThreshold}`)

    return {
      checkInStatus: checkIn <= checkInEndLimit ? "Tepat Waktu" : "Terlambat",
      checkOutStatus: checkOutNext > overtimeThresholdNext ? "Lembur" : "Tepat Waktu",
    }
  }

  return {
    checkInStatus: checkIn <= checkInEndLimit ? "Tepat Waktu" : "Terlambat",
    checkOutStatus: checkOut > overtimeThreshold ? "Lembur" : "Tepat Waktu",
  }
}

export function getTimeRangeDisplay(shift: keyof TimeSettings, timeSettings: TimeSettings) {
  const settings = timeSettings[shift]

  return {
    checkInRange: `${settings.checkInStart} - ${settings.checkInEnd}`,
    lateAfter: settings.checkInEnd,
    normalCheckOut: `${settings.checkOutStart} - ${settings.checkOutEnd}`,
    overtimeAfter: settings.overtimeThreshold,
  }
}

export function isWithinTimeRange(currentTime: string, startTime: string, endTime: string): boolean {
  const current = new Date(`2000-01-01T${currentTime}`)
  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)

  return current >= start && current <= end
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`
}
