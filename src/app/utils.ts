import { DappRequestOrigin } from 'src/analytics/types'
import { ActiveDapp } from 'src/dapps/types'

// Assume that if we have an active dapp, any WC request comes from the in-app webview.
// Note that this may be incorrect if the user interacts with another dapp while the dapp webview is open.
// I thought about comparing the request url to the active dapp url, but that could fail too if the dapp url we have is different.
// For instance the dapp-list could contain a "example.com", while the request is "dapp.something.com".
export function getDappRequestOrigin(activeDapp: ActiveDapp | null) {
  if (activeDapp) {
    return DappRequestOrigin.InAppWebView
  }

  return DappRequestOrigin.External
}
