import { PlatformPlugin, PluginType, SegmentEvent } from '@segment/analytics-react-native'
import Logger from 'src/utils/Logger'

/**
 * Plugin that injects the user traits to every event
 *
 * Added to migrate to Segment v2 without breaking existing dashboards that rely on context_traits_*. All this data is
 *  available as "super" properties, so we can eventually get rid of it.
 *
 * TODO eventually: remove dependencies and delete this plugin, see https://linear.app/valora/issue/ENG-60/remove-dependencies-on-context-traits-
 */
export class InjectTraits extends PlatformPlugin {
  type = PluginType.before

  execute(event: SegmentEvent) {
    try {
      return this.analytics
        ? {
            ...event,
            context: {
              ...event.context,
              traits: {
                ...event.context?.traits,
                ...this.analytics.userInfo.get().traits,
              },
            },
          }
        : event
    } catch (error) {
      Logger.error('SegmentPlugin InjectTraits', 'Error injecting traits', error)
      return event
    }
  }
}
