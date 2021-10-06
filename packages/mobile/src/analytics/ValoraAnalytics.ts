import Analytics, { Analytics as analytics } from '@segment/analytics-react-native'
import Adjust from '@segment/analytics-react-native-adjust'
import CleverTapSegment from '@segment/analytics-react-native-clevertap'
import Firebase from '@segment/analytics-react-native-firebase'
import CleverTap from 'clevertap-react-native'
import { sha256 } from 'ethereumjs-util'
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions'
import { AppEvents } from 'src/analytics/Events'
import { AnalyticsPropertiesList } from 'src/analytics/Properties'
import { DEFAULT_TESTNET, FIREBASE_ENABLED, isE2EEnv, SEGMENT_API_KEY } from 'src/config'
import { store } from 'src/redux/store'
import Logger from 'src/utils/Logger'
import { isPresent } from 'src/utils/typescript'

const TAG = 'ValoraAnalytics'

async function getDeviceInfo() {
  return {
    AppName: DeviceInfo.getApplicationName(),
    Brand: DeviceInfo.getBrand(),
    BuildNumber: DeviceInfo.getBuildNumber(),
    BundleId: DeviceInfo.getBundleId(),
    Carrier: await DeviceInfo.getCarrier(),
    DeviceId: DeviceInfo.getDeviceId(),
    FirstInstallTime: await DeviceInfo.getFirstInstallTime(),
    FontScale: await DeviceInfo.getFontScale(),
    FreeDiskStorage: await DeviceInfo.getFreeDiskStorage(),
    InstallReferrer: await DeviceInfo.getInstallReferrer(),
    InstanceID: await DeviceInfo.getInstanceId(),
    LastUpdateTime: await DeviceInfo.getLastUpdateTime(),
    Manufacturer: await DeviceInfo.getManufacturer(),
    MaxMemory: await DeviceInfo.getMaxMemory(),
    Model: DeviceInfo.getModel(),
    ReadableVersion: DeviceInfo.getReadableVersion(),
    SystemName: DeviceInfo.getSystemName(),
    SystemVersion: DeviceInfo.getSystemVersion(),
    TotalDiskCapacity: await DeviceInfo.getTotalDiskCapacity(),
    TotalMemory: await DeviceInfo.getTotalMemory(),
    UniqueID: DeviceInfo.getUniqueId(),
    UserAgent: await DeviceInfo.getUserAgent(),
    Version: DeviceInfo.getVersion(),
    isEmulator: await DeviceInfo.isEmulator(),
    isTablet: DeviceInfo.isTablet(),
    UsedMemory: await DeviceInfo.getUsedMemory(),
  }
}

const SEGMENT_OPTIONS: analytics.Configuration = {
  using: [FIREBASE_ENABLED ? Firebase : undefined, Adjust, CleverTapSegment].filter(isPresent),
  flushAt: 20,
  debug: __DEV__,
  trackAppLifecycleEvents: true,
  recordScreenViews: true,
  trackAttributionData: true,
  ios: {
    trackAdvertising: false,
    trackDeepLinks: true,
  },
}

class ValoraAnalytics {
  sessionId: string = ''
  userAddress: string = ''
  deviceInfo: object = {}

  async init() {
    try {
      if (!SEGMENT_API_KEY) {
        throw Error('API Key not present, likely due to environment. Skipping enabling')
      }

      await Analytics.setup(SEGMENT_API_KEY, SEGMENT_OPTIONS)

      try {
        const deviceInfo = await getDeviceInfo()
        this.deviceInfo = deviceInfo
        this.sessionId = sha256('0x' + deviceInfo.UniqueID.split('-').join('') + String(Date.now()))
          .toString('hex')
          .slice(2)
      } catch (error) {
        Logger.error(TAG, 'getDeviceInfo error', error)
      }

      Logger.info(TAG, 'Segment Analytics Integration initialized!')

      CleverTap.enableDeviceNetworkInfoReporting(true)
    } catch (error) {
      Logger.error(TAG, `Segment setup error: ${error.message}\n`, error)
    }
  }

  isEnabled() {
    // Remove __DEV__ here to test analytics in dev builds
    return !__DEV__ && store.getState().app.analyticsEnabled
  }

  startSession(
    eventName: typeof AppEvents.app_launched,
    eventProperties: AnalyticsPropertiesList[AppEvents.app_launched]
  ) {
    this.track(eventName, {
      deviceInfo: this.deviceInfo,
      ...eventProperties,
    })

    this.requestTrackingPermissionIfNeeded().catch((error) => {
      Logger.error(TAG, 'Failure while requesting tracking permission', error)
    })
  }

  getSessionId() {
    return this.sessionId
  }

  setUserAddress(address?: string | null) {
    if (address) {
      this.userAddress = address.toLowerCase()
    } else if (address === null) {
      this.userAddress = 'unverified'
    } else {
      this.userAddress = 'unknown'
    }
  }

  track<EventName extends keyof AnalyticsPropertiesList>(
    ...args: undefined extends AnalyticsPropertiesList[EventName]
      ? [EventName] | [EventName, AnalyticsPropertiesList[EventName]]
      : [EventName, AnalyticsPropertiesList[EventName]]
  ) {
    const [eventName, eventProperties] = args

    if (!this.isEnabled()) {
      Logger.debug(TAG, `Analytics is disabled, not tracking event ${eventName}`)
      return
    }

    if (!SEGMENT_API_KEY) {
      Logger.debug(TAG, `No API key, not tracking event ${eventName}`)
      return
    }

    const props: {} = {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAddress: this.userAddress,
      celoNetwork: DEFAULT_TESTNET,
      ...eventProperties,
    }

    Logger.info(TAG, `Tracking event ${eventName} with properties: ${JSON.stringify(props)}`)

    Analytics.track(eventName, props).catch((err) => {
      Logger.error(TAG, `Failed to track event ${eventName}`, err)
    })
  }

  addUserProfile(userID: string, userInfo = {}) {
    if (!this.isEnabled()) {
      Logger.debug(TAG, `Analytics is disabled, not tracking user ${userID}`)
      return
    }

    if (!SEGMENT_API_KEY) {
      Logger.debug(TAG, `No API key, not tracking user ${userID}`)
      return
    }

    Analytics.identify(userID, userInfo).catch((err) => {
      Logger.error(TAG, `Failed to identify user ${userID}`, err)
    })
  }

  page(page: string, eventProperties = {}) {
    if (!SEGMENT_API_KEY) {
      return
    }

    Analytics.screen(page, eventProperties).catch((err) => {
      Logger.error(TAG, 'Error tracking page', err)
    })
  }

  async reset() {
    try {
      await Analytics.flush()
      await Analytics.reset()
    } catch (error) {
      Logger.error(TAG, 'Error resetting analytics', error)
    }
  }

  private async requestTrackingPermissionIfNeeded() {
    // TODO: remove `isE2EEnv` and set permission via Detox when we upgrade
    if (Platform.OS !== 'ios' || isE2EEnv) {
      return
    }

    const appTrackingPermission = await check(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY)
    Logger.debug(TAG, `iOS tracking permission: ${appTrackingPermission}`)
    if (appTrackingPermission !== RESULTS.DENIED) {
      // The permission has already been requested / is not requestable
      // See https://github.com/zoontek/react-native-permissions#permissions-statuses
      return
    }

    Logger.debug(TAG, `iOS requesting tracking permission`)
    this.track(AppEvents.request_tracking_permission_started, {
      currentPermission: appTrackingPermission,
    })
    const newAppTrackingPermission = await request(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY)
    Logger.debug(TAG, `iOS tracking permission after request: ${newAppTrackingPermission}`)
    if (newAppTrackingPermission === RESULTS.GRANTED) {
      this.track(AppEvents.request_tracking_permission_accepted, {
        newPermission: newAppTrackingPermission,
      })
    } else {
      this.track(AppEvents.request_tracking_permission_declined, {
        newPermission: newAppTrackingPermission,
      })
    }
  }
}

export default new ValoraAnalytics()
