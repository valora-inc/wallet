import HandleDeepLinkSend from './usecases/HandleDeepLinkSend'
import { quickOnboarding } from './utils/utils'

describe('Given', () => {
  beforeAll(async () => {
    // Clear redux store ?
    await quickOnboarding()
  })
  // The behavior for this case is not really specified yet
  // we kind of know what we want to happen but the code is not there yet
  // added this test case as a reminder to fix that
  // basically we want the app to remember the deep link and handle it after
  // the account is created or restored
  // also would be great if the deep link survives through an app install
  // similar to the invite links

  describe('Deep Link Send', HandleDeepLinkSend)
})
