import * as AnalyticsEvents from 'src/analytics/Events'

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
})
