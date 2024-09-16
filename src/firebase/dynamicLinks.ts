import dynamicLinks, { FirebaseDynamicLinksTypes } from '@react-native-firebase/dynamic-links'
import { WEB_LINK } from 'src/brandingConfig'
import {
  APP_STORE_ID as appStoreId,
  DYNAMIC_LINK_DOMAIN_URI_PREFIX as baseURI,
  APP_BUNDLE_ID as bundleId,
} from 'src/config'
import { NetworkId } from 'src/transactions/types'

const commonDynamicLinkParams: Omit<FirebaseDynamicLinksTypes.DynamicLinkParameters, 'link'> = {
  domainUriPrefix: baseURI,
  ios: {
    appStoreId,
    bundleId,
  },
  android: {
    packageName: bundleId,
  },
}

export async function createInviteLink(address: string) {
  return dynamicLinks().buildShortLink({
    ...commonDynamicLinkParams,
    link: `${WEB_LINK}share/${address}`,
  })
}

export async function createJumpstartLink(privateKey: string, networkId: NetworkId) {
  // avoid calling firebase sdk with private key during link creation to protect
  // the private key from being stored
  const dynamicLink = await dynamicLinks().buildLink({
    ...commonDynamicLinkParams,
    link: WEB_LINK,
  })
  const dynamicUrl = new URL(dynamicLink)
  dynamicUrl.searchParams.set('link', `${WEB_LINK}jumpstart/${privateKey}/${networkId}`)

  // the firebase dynamic links sdk encodes dots and dashes even though it is
  // not strictly required for urls. calling searchParams.set seems to transform
  // __all__ search params to be url encoded, where dots and dashes are no
  // longer encoded. This is probably okay, but to be extra safe we will put
  // back the encoding ourselves.
  const searchParams = dynamicUrl.search.replace(/\./g, '%2E').replace(/-/g, '%2D')
  return `${dynamicUrl.origin}/${searchParams}`
}
