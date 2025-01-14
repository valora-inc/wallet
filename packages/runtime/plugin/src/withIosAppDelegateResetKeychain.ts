// Inspired by https://github.com/expo/expo/blob/03e99016c9c5b9ad47864b204511ded2dec80375/packages/%40expo/config-plugins/src/ios/Maps.ts#L6
import { ConfigPlugin, withAppDelegate } from '@expo/config-plugins'
import { mergeContents, MergeResults } from '@expo/config-plugins/build/utils/generateCode'

const RESET_KEYCHAIN_FUNCTION = `
// Use same key as react-native-secure-key-store
// so we don't reset already working installs
static NSString * const kHasRunBeforeKey = @"RnSksIsAppInstalled";

// Reset keychain on first app run, this is so we don't run with leftover items
// after reinstalling the app
static void resetKeychainIfNecessary()
{
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  if ([defaults boolForKey:kHasRunBeforeKey]) {
    return;
  }
  
  NSArray *secItemClasses = @[(__bridge id)kSecClassGenericPassword,
                              (__bridge id)kSecAttrGeneric,
                              (__bridge id)kSecAttrAccount,
                              (__bridge id)kSecClassKey,
                              (__bridge id)kSecAttrService];
  for (id secItemClass in secItemClasses) {
    NSDictionary *spec = @{(__bridge id)kSecClass:secItemClass};
    SecItemDelete((__bridge CFDictionaryRef)spec);
  }
  
  [defaults setBool:YES forKey:kHasRunBeforeKey];
  [defaults synchronize];
}
`

const METHOD_INVOCATION_BLOCK = `resetKeychainIfNecessary();`

// https://regex101.com/r/nHrTa9/1/
const INVOCATION_LINE_MATCHER =
  /-\s*\(BOOL\)\s*application:\s*\(UIApplication\s*\*\s*\)\s*\w+\s+didFinishLaunchingWithOptions:/g

function addResetKeychainFunction(src: string): MergeResults {
  return mergeContents({
    tag: '@mobilestack-xyz/runtime/app-delegate-reset-keychain-function',
    src,
    newSrc: RESET_KEYCHAIN_FUNCTION,
    anchor: /@implementation AppDelegate/,
    offset: -1,
    comment: '//',
  })
}

function addCallResetKeychain(src: string): MergeResults {
  // tests if the opening `{` is in the new line
  const multilineMatcher = new RegExp(INVOCATION_LINE_MATCHER.source + '.+\\n*{')
  const isHeaderMultiline = multilineMatcher.test(src)

  return mergeContents({
    tag: '@mobilestack-xyz/runtime/app-delegate-call-reset-keychain',
    src,
    newSrc: METHOD_INVOCATION_BLOCK,
    anchor: INVOCATION_LINE_MATCHER,
    // new line will be inserted right below matched anchor
    // or two lines, if the `{` is in the new line
    offset: isHeaderMultiline ? 2 : 1,
    comment: '//',
  })
}

export const withIosAppDelegateResetKeychain: ConfigPlugin = (config) => {
  return withAppDelegate(config, (config) => {
    if (!['objc', 'objcpp'].includes(config.modResults.language)) {
      throw new Error(
        `Cannot setup MobileStack runtime because the project AppDelegate is not a supported language: ${config.modResults.language}`
      )
    }

    try {
      config.modResults.contents = addResetKeychainFunction(config.modResults.contents).contents
      config.modResults.contents = addCallResetKeychain(config.modResults.contents).contents
    } catch (error: any) {
      if (error.code === 'ERR_NO_MATCH') {
        throw new Error(
          `Cannot add MobileStack runtime to the project's AppDelegate because it's malformed. Please report this with a copy of your project AppDelegate.`
        )
      }
      throw error
    }
    return config
  })
}
