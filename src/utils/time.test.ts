import i18n from 'src/i18n'
import {
  formatDistanceToNow,
  formatFeedDate,
  formatFeedSectionTitle,
  formatFeedTime,
  timeDeltaInDays,
} from 'src/utils/time'

const ONE_HOUR_MS = 60 * 60 * 1000
const ONE_DAY_MS = 24 * ONE_HOUR_MS

describe('utils/time', () => {
  let dateNowSpy: any
  beforeAll(() => {
    // Lock Time
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1487076708000)
  })

  afterAll(() => {
    // Unlock Time
    dateNowSpy.mockRestore()
  })

  const wedMarch132019at1050 = 1552517413326
  describe('formatFeedTime', () => {
    it('returns time formatted as string and is accurate', () => {
      expect(formatFeedTime(wedMarch132019at1050, i18n)).toEqual('10:50 PM')
    })
    it('works when number is in seconds', () => {
      expect(formatFeedTime(wedMarch132019at1050 / 1000, i18n)).toEqual('10:50 PM')
    })
  })
  describe('formatFeedDate', () => {
    it('returns date formatted as string and is accurate', () => {
      expect(formatFeedDate(wedMarch132019at1050, i18n)).toEqual('Mar 13')
    })
    it('works when number is in seconds', () => {
      expect(formatFeedDate(wedMarch132019at1050 / 1000, i18n)).toEqual('Mar 13')
    })
  })
  describe('formatFeedSectionTitle', () => {
    it('returns date formatted as string and is accurate', () => {
      expect(formatFeedSectionTitle(wedMarch132019at1050, i18n)).toEqual('March 2019')
    })
    it('works when number is in seconds', () => {
      expect(formatFeedSectionTitle(wedMarch132019at1050 / 1000, i18n)).toEqual('March 2019')
    })
  })
  describe('timeDeltaInDays', () => {
    it('returns correct time delta', () => {
      expect(timeDeltaInDays(new Date().getTime(), new Date().getTime() - ONE_DAY_MS)).toEqual(1)
    })
  })
  describe('formatDistanceToNow', () => {
    it('returns correct distance to now', () => {
      expect(formatDistanceToNow(wedMarch132019at1050, i18n)).toEqual('about 2 years')
    })
  })
})
