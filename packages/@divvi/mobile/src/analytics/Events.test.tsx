import * as AnalyticsEvents from 'src/analytics/Events'

//
// Event names in Firebase must contain 1 to 40 alphanumeric characters or
// underscores.
//  https://firebase.google.com/docs/reference/cpp/group/event-names
//
const FIREBASE_MAX_EVENT_NAME_LENGTH = 40
const FIREBASE_MIN_EVENT_NAME_LENGTH = 1
const FIREBASE_EVENT_NAME_REGEX = /^[a-zA-Z0-9_]+$/

describe('AnalyticsEvents', () => {
  it('all events keys should match their values', () => {
    expect.hasAssertions()
    const eventsEnums = Object.keys(AnalyticsEvents)

    for (const eventEnumKey of eventsEnums) {
      // @ts-ignore
      const eventEnum = AnalyticsEvents[eventEnumKey]

      for (const [key, value] of Object.entries(eventEnum)) {
        expect(value).toBe(key)
      }
    }
  })

  describe.each(Object.keys(AnalyticsEvents))(
    "enum '%s' should have valid values",
    (eventEnumName) => {
      // @ts-ignore
      const eventEnum = AnalyticsEvents[eventEnumName] as { [key: string]: string }

      it.each(Object.values(eventEnum))(
        `event name '%s' should contain ${FIREBASE_MIN_EVENT_NAME_LENGTH} to ${FIREBASE_MAX_EVENT_NAME_LENGTH} characters`,
        (value) => {
          expect(value.length).toBeLessThanOrEqual(FIREBASE_MAX_EVENT_NAME_LENGTH)
          expect(value.length).toBeGreaterThanOrEqual(FIREBASE_MIN_EVENT_NAME_LENGTH)
        }
      )

      it.each(Object.values(eventEnum))(
        `event name '%s' should contain alphanumeric characters or underscores`,
        (value) => {
          expect(value).toMatch(FIREBASE_EVENT_NAME_REGEX)
        }
      )
    }
  )
})
