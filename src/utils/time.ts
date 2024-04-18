import { differenceInYears } from 'date-fns/differenceInYears'
import { format } from 'date-fns/format'
import { formatDistanceToNow as dateFnsFormatDistanceToNow } from 'date-fns/formatDistanceToNow'
import { getYear } from 'date-fns/getYear'
import { i18n as i18nType } from 'i18next'
import locales from 'locales'
import i18n from 'src/i18n'

export const formatFeedTime = (timestamp: number, i18next: i18nType) => {
  return quickFormat(timestamp, i18next, 'h:mm a')
}

export const formatFeedDate = (timestamp: number, i18next: i18nType) => {
  return quickFormat(timestamp, i18next, 'MMM d')
}

export const formatFeedSectionTitle = (timestamp: number, i18next: i18nType) => {
  const currentYear = getYear(Date.now())
  const timestampYear = getYear(millisecondsSinceEpoch(timestamp))
  const dateFormat = currentYear === timestampYear ? 'MMMM' : 'MMMM yyyy'
  const title = quickFormat(timestamp, i18next, dateFormat)
  return title
}

export const getDatetimeDisplayString = (timestamp: number, i18next: i18nType) => {
  const timeFormatted = formatFeedTime(timestamp, i18next)
  const dateFormatted = formatFeedDate(timestamp, i18next)
  return `${dateFormatted} ${i18n.t('at')} ${timeFormatted}`
}

export const formatDistanceToNow = (
  date: Parameters<typeof dateFnsFormatDistanceToNow>[0],
  i18next: i18nType,
  options?: Omit<NonNullable<Parameters<typeof dateFnsFormatDistanceToNow>[1]>, 'locale'>
) => {
  return dateFnsFormatDistanceToNow(date, { ...options, locale: locale(i18next) })
}

const ONE_SECOND_IN_MILLIS = 1000
const ONE_MINUTE_IN_MILLIS = 60 * ONE_SECOND_IN_MILLIS
export const ONE_HOUR_IN_MILLIS = 60 * ONE_MINUTE_IN_MILLIS
export const ONE_DAY_IN_MILLIS = 24 * ONE_HOUR_IN_MILLIS

export const timeDeltaInDays = (currTime: number, prevTime: number) => {
  return timeDifference(currTime, prevTime) / ONE_DAY_IN_MILLIS
}

export const timeDeltaInHours = (currTime: number, prevTime: number) => {
  return timeDifference(currTime, prevTime) / ONE_HOUR_IN_MILLIS
}

export const timeDeltaInSeconds = (currTime: number, prevTime: number) => {
  return timeDifference(currTime, prevTime) / ONE_SECOND_IN_MILLIS
}

function timeDifference(currTime: number, prevTime: number) {
  return 1.0 * (millisecondsSinceEpoch(currTime) - millisecondsSinceEpoch(prevTime))
}

// some timestamps are in seconds, some are in miliseconds
// assume dates will be within a few decades of now and multiple accordingly
function millisecondsSinceEpoch(timestamp: number) {
  return Math.abs(differenceInYears(timestamp, Date.now())) > 40 ? timestamp * 1000 : timestamp
}

function quickFormat(timestamp: number, i18next: i18nType, formatRule: string) {
  return format(millisecondsSinceEpoch(timestamp), formatRule, { locale: locale(i18next) })
}

function locale(i18next: i18nType) {
  return locales[i18next?.language]?.dateFns ?? locales['en-US']?.dateFns
}
