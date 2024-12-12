import dynamicLinks from '@react-native-firebase/dynamic-links'
import CleverTap from 'clevertap-react-native'
import { useEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { Linking } from 'react-native'
import { deepLinkDeferred, openDeepLink } from 'src/app/actions'
import { pendingDeepLinkSelector } from 'src/app/selectors'
import { DYNAMIC_LINK_DOMAIN_URI_PREFIX, FIREBASE_ENABLED } from 'src/config'
import { hasVisitedHomeSelector } from 'src/home/selectors'
import { useDispatch, useSelector } from 'src/redux/hooks'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'

export const useDeepLinks = () => {
  const [isConsumingInitialLink, setIsConsumingInitialLink] = useState(false)
  const dispatch = useDispatch()

  const pendingDeepLink = useSelector(pendingDeepLinkSelector)
  const address = useSelector(walletAddressSelector)
  // having seen the home screen is a proxy for having finished onboarding. we
  // want to prevent consuming deep links during the onboarding flow in case the
  // deep link includes navigation.
  const hasVisitedHome = useSelector(hasVisitedHomeSelector)

  const shouldConsumeDeepLinks = address && hasVisitedHome

  const handleOpenURL = (event: { url: string }, isSecureOrigin: boolean = false) => {
    if (event.url.startsWith(DYNAMIC_LINK_DOMAIN_URI_PREFIX)) {
      // dynamic links come through both the `dynamicLinks` and `Linking` APIs.
      // the dynamicLinks handlers will already resolve the link, only the
      // Linking api will pass the raw dynamic link with the prefix through here
      // so we can ignore it to avoid double handling the link.
      Logger.info('useDeepLinks/handleOpenURL', 'Ignoring dynamic link', event.url)
      return
    }
    Logger.debug(
      'useDeepLinks/handleOpenURL',
      `Handling url: ${event.url}, isSecureOrigin: ${isSecureOrigin}, shouldConsumeDeepLinks: ${shouldConsumeDeepLinks}`
    )
    // defer consuming deep links until the user has completed onboarding
    if (shouldConsumeDeepLinks) {
      dispatch(openDeepLink(event.url, isSecureOrigin))
    } else {
      dispatch(deepLinkDeferred(event.url, isSecureOrigin))
    }
  }

  useEffect(() => {
    if (pendingDeepLink && shouldConsumeDeepLinks) {
      Logger.debug('useDeepLinks/useEffect', 'Consuming pending deep link', pendingDeepLink.url)
      dispatch(openDeepLink(pendingDeepLink.url, pendingDeepLink.isSecureOrigin))
    }
  }, [pendingDeepLink, address, hasVisitedHome])

  const handleOpenInitialURL = (event: { url: string }, isSecureOrigin: boolean = false) => {
    // this function handles initial deep links, but not dynamic links (which
    // are handled by firebase)
    if (!isConsumingInitialLink) {
      setIsConsumingInitialLink(true)
      handleOpenURL(event, isSecureOrigin)
    }
  }

  useAsync(async () => {
    // Handles opening Clevertap deeplinks when app is closed
    // @ts-expect-error the clevertap ts definition has url as an object, but it
    // is a string!
    CleverTap.getInitialUrl(async (err: any, url: string) => {
      if (err) {
        if (/CleverTap initialUrl is (nil|null)/gi.test(err)) {
          Logger.debug('useDeepLinks/useAsync', 'CleverTap InitialUrl is nil|null', err)
        } else {
          Logger.error('useDeepLinks/useAsync', 'App CleverTap Deeplink on Load', err)
        }
      } else if (url) {
        Logger.debug('useDeepLinks/useAsync', 'CleverTap InitialUrl', url)
        handleOpenInitialURL({ url }, true)
      }
    })

    if (FIREBASE_ENABLED) {
      const firebaseUrl = await dynamicLinks().getInitialLink()
      if (firebaseUrl) {
        Logger.debug('useDeepLinks/useAsync', 'Firebase InitialLink', firebaseUrl.url)
        handleOpenURL({ url: firebaseUrl.url })
      }
    }

    const initialUrl = await Linking.getInitialURL()
    if (initialUrl) {
      Logger.debug('useDeepLinks/useAsync', 'Linking InitialUrl', initialUrl)
      handleOpenInitialURL({ url: initialUrl })
    }
  }, [])

  useEffect(() => {
    // Handles opening Clevertap deeplinks when app is open.
    CleverTap.addListener('CleverTapPushNotificationClicked', async (event: any) => {
      Logger.debug('useDeepLinks/useEffect', 'CleverTapPushNotificationClicked', event)
      const url = event['wzrk_dl']
      if (url) {
        Logger.debug('useDeepLinks/useEffect', 'CleverTapPushNotificationClicked, opening url', url)
        handleOpenURL({ url }, true)
      }
    })

    // Handles opening any deep links, this listener is also triggered when a
    // its a clevertap push notification or when the app is closed, so the
    // openDeepLink action could be dispatched multiple times in those cases.
    const linkingEventListener = Linking.addEventListener('url', (event) => {
      Logger.debug('useDeepLinks/useEffect', 'Linking url event', event)
      handleOpenURL(event)
    })

    let dynamicLinksUnsubsribe: () => void | undefined
    if (FIREBASE_ENABLED) {
      dynamicLinksUnsubsribe = dynamicLinks().onLink(({ url }) => {
        Logger.debug('useDeepLinks/useEffect', 'Dynamic link event', url)
        handleOpenURL({ url })
      })
    }

    return () => {
      CleverTap.removeListener('CleverTapPushNotificationClicked')
      linkingEventListener.remove()
      dynamicLinksUnsubsribe?.()
    }
  }, [])
}
