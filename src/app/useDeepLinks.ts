import dynamicLinks from '@react-native-firebase/dynamic-links'
import CleverTap from 'clevertap-react-native'
import { useEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { Linking, Platform } from 'react-native'
import { useDispatch } from 'react-redux'
import { openDeepLink } from 'src/app/actions'
import { DYNAMIC_LINK_DOMAIN_URI_PREFIX, FIREBASE_ENABLED } from 'src/config'
import Logger from 'src/utils/Logger'

export const useDeepLinks = () => {
  const [isConsumingInitialLink, setIsConsumingInitialLink] = useState(false)

  const dispatch = useDispatch()

  const handleOpenURL = (event: { url: string }, isSecureOrigin: boolean = false) => {
    dispatch(openDeepLink(event.url, isSecureOrigin))
  }

  const handleOpenInitialURL = (event: { url: string }, isSecureOrigin: boolean = false) => {
    // this function handles initial deep links, but not dynamic links (which
    // are handled by firebase)
    if (!isConsumingInitialLink && !event.url.startsWith(DYNAMIC_LINK_DOMAIN_URI_PREFIX)) {
      setIsConsumingInitialLink(true)
      handleOpenURL(event, isSecureOrigin)
    }
  }

  useAsync(async () => {
    // Handles opening Clevertap deeplinks when app is closed / in background
    // @ts-expect-error the clevertap ts definition has url as an object, but it
    // is a string!
    CleverTap.getInitialUrl(async (err: any, url: string) => {
      if (err) {
        if (/CleverTap initialUrl is (nil|null)/gi.test(err)) {
          Logger.warn('App/componentDidMount', 'CleverTap InitialUrl is nil|null', err)
        } else {
          Logger.error('App/componentDidMount', 'App CleverTap Deeplink on Load', err)
        }
      } else if (url) {
        handleOpenInitialURL({ url }, true)
      }
    })

    if (FIREBASE_ENABLED) {
      const firebaseUrl = await dynamicLinks().getInitialLink()
      if (firebaseUrl) {
        handleOpenURL({ url: firebaseUrl.url })
      }
    }

    const initialUrl = await Linking.getInitialURL()
    if (initialUrl) {
      handleOpenInitialURL({ url: initialUrl })
    }
  }, [])

  useEffect(() => {
    // Handles opening Clevertap deeplinks when app is open
    CleverTap.addListener('CleverTapPushNotificationClicked', async (event: any) => {
      // Url location differs for iOS and Android
      const url = Platform.OS === 'ios' ? event.customExtras['wzrk_dl'] : event['wzrk_dl']
      if (url) {
        handleOpenURL({ url }, true)
      }
    })

    const linkingEventListener = Linking.addEventListener('url', handleOpenURL)

    let dynamicLinksUnsubsribe: () => void | undefined
    if (FIREBASE_ENABLED) {
      dynamicLinksUnsubsribe = dynamicLinks().onLink(({ url }) => handleOpenURL({ url }))
    }

    return () => {
      CleverTap.removeListener('CleverTapPushNotificationClicked')
      linkingEventListener.remove()
      dynamicLinksUnsubsribe?.()
    }
  }, [])
}
