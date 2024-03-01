import dynamicLinks from '@react-native-firebase/dynamic-links'
import { WEB_LINK } from 'src/brandingConfig'
import {
  APP_STORE_ID as appStoreId,
  DYNAMIC_LINK_DOMAIN_URI_PREFIX as baseURI,
  APP_BUNDLE_ID as bundleId,
} from 'src/config'
import { NetworkId } from 'src/transactions/types'

async function createDynamicLink(link: string) {
  return dynamicLinks().buildShortLink({
    link: `${WEB_LINK}${link}`,
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

export async function createInviteLink(address: string) {
  return createDynamicLink(`share/${address}`)
}

export async function createJumpstartLink(privateKey: string, networkId: NetworkId) {
  return createDynamicLink(`jumpstart/${privateKey}/${networkId}`)
}
