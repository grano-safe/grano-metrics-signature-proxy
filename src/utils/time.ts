import dayjs, { Dayjs } from 'dayjs'

export function systemTymeIsMoreThanOneMinuteFromReference({
  now,
  ref,
}: {
  now: Dayjs | Date
  ref: Dayjs | Date
}) {
  const refDayjs = dayjs(ref)

  if (!refDayjs.isValid()) {
    throw new Error('Invalid Date Reference Provided')
  }

  const diffInMinutes = Math.abs(refDayjs.diff(now, 'minute'))

  return diffInMinutes > 1
}
