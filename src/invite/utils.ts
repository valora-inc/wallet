import dynamicLinks from '@react-native-firebase/dynamic-links'
import { WEB_LINK } from 'src/brandingConfig'
import {
  APP_BUNDLE_ID as bundleId,
  APP_STORE_ID as appStoreId,
  DYNAMIC_LINK_DOMAIN_URI_PREFIX as baseURI,
} from 'src/config'

export async function createDynamicLink(address: string) {
  return dynamicLinks().buildShortLink({
    link: `${WEB_LINK}share/${address}`,
    domainUriPrefix: baseURI,
    ios: {
      appStoreId,
      bundleId,
    },
    android: {
      packageName: bundleId,
    },
  })
}
