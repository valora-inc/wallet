import dynamicLinks, { FirebaseDynamicLinksTypes } from '@react-native-firebase/dynamic-links'
import {
  APP_STORE_ID as appStoreId,
  DYNAMIC_LINK_DOMAIN_URI_PREFIX as baseURI,
  APP_BUNDLE_ID as bundleId,
} from 'src/config'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { NetworkId } from 'src/transactions/types'
import { appendPath } from 'src/utils/string'

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
  const { links } = getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.APP_CONFIG])
  return dynamicLinks().buildShortLink({
    ...commonDynamicLinkParams,
    link: appendPath(links.web, `share/${address}`),
  })
}

export async function createJumpstartLink(privateKey: string, networkId: NetworkId) {
  const { links } = getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.APP_CONFIG])
  // avoid calling firebase sdk with private key during link creation to protect
  // the private key from being stored
  const dynamicLink = await dynamicLinks().buildLink({
    ...commonDynamicLinkParams,
    link: links.web,
  })
  const dynamicUrl = new URL(dynamicLink)
  dynamicUrl.searchParams.set('link', appendPath(links.web, `jumpstart/${privateKey}/${networkId}`))

  // the firebase dynamic links sdk encodes dots and dashes even though it is
  // not strictly required for urls. calling searchParams.set seems to transform
  // __all__ search params to be url encoded, where dots and dashes are no
  // longer encoded. This is probably okay, but to be extra safe we will put
  // back the encoding ourselves.
  const searchParams = dynamicUrl.search.replace(/\./g, '%2E').replace(/-/g, '%2D')
  return `${dynamicUrl.origin}/${searchParams}`
}
