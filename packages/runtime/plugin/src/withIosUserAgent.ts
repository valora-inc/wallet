// Inspired by https://github.com/expo/expo/blob/03e99016c9c5b9ad47864b204511ded2dec80375/packages/%40expo/config-plugins/src/ios/Maps.ts#L6
import { ConfigPlugin, withAppDelegate } from '@expo/config-plugins'
import { mergeContents, MergeResults } from '@expo/config-plugins/build/utils/generateCode'
import {
  APPLICATION_DID_FINISH_LAUNCHING_LINE_MATCHER,
  APPLICATION_DID_FINISH_LAUNCHING_LINE_MATCHER_MULTILINE,
} from './consts'

function getUserAgentCode(appName: string) {
  return `
RCTSetCustomNSURLSessionConfigurationProvider(^NSURLSessionConfiguration *{
    NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
    
    NSDictionary *infoDictionary = NSBundle.mainBundle.infoDictionary;
    NSString *appVersion = [infoDictionary objectForKey:@"CFBundleShortVersionString"];
    UIDevice *device = UIDevice.currentDevice;
    // Format we want: App/1.0.0 (iOS 15.0; iPhone)
    NSString *userAgent = [NSString stringWithFormat:@"${appName}/%@ (%@ %@; %@)", appVersion, device.systemName, device.systemVersion, device.model];
    configuration.HTTPAdditionalHeaders = @{ @"User-Agent": userAgent };
    
    return configuration;
  });
`
}

function addUserAgentCode(src: string, appName: string): MergeResults {
  // tests if the opening `{` is in the new line
  const isHeaderMultiline = APPLICATION_DID_FINISH_LAUNCHING_LINE_MATCHER_MULTILINE.test(src)

  return mergeContents({
    tag: '@mobilestack-xyz/runtime/app-delegate-user-agent-code',
    src,
    newSrc: getUserAgentCode(appName),
    anchor: APPLICATION_DID_FINISH_LAUNCHING_LINE_MATCHER,
    // new line will be inserted right below matched anchor
    // or two lines, if the `{` is in the new line
    offset: isHeaderMultiline ? 2 : 1,
    comment: '//',
  })
}

/**
 * Config plugin for setting an app-wide User-Agent header for all requests
 * TODO: consider shipping this as a react native module
 */
export const withIosUserAgent: ConfigPlugin<{ appName?: string }> = (config, { appName }) => {
  return withAppDelegate(config, (config) => {
    if (!['objc', 'objcpp'].includes(config.modResults.language)) {
      throw new Error(
        `Cannot setup MobileStack runtime because the project AppDelegate is not a supported language: ${config.modResults.language}`
      )
    }

    try {
      config.modResults.contents = addUserAgentCode(
        config.modResults.contents,
        appName ?? config.name
      ).contents
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
