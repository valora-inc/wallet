/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>

#import "RNCConfig.h"

#import <React/RCTLinkingManager.h>
#import <React/RCTHTTPRequestHandler.h>

@import Firebase;

#import "RNSplashScreen.h"
#import <segment_analytics_react_native-Swift.h>

#import <UserNotifications/UserNotifications.h>
#import <CleverTapSDK/CleverTap.h>
#import <CleverTapReact/CleverTapReactManager.h>

static NSString *const kRNConcurrentRoot = @"concurrentRoot";

#ifdef FB_SONARKIT_ENABLED
#import <FlipperKit/FlipperClient.h>
#import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h>
#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>
#import <FlipperKitReactPlugin/FlipperKitReactPlugin.h>

static void InitializeFlipper(UIApplication *application)
{
  FlipperClient *client = [FlipperClient sharedClient];
  SKDescriptorMapper *layoutDescriptorMapper = [[SKDescriptorMapper alloc] initWithDefaults];
  [client addPlugin:[[FlipperKitLayoutPlugin alloc] initWithRootNode:application
                                                withDescriptorMapper:layoutDescriptorMapper]];
  [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]];
  [client addPlugin:[FlipperKitReactPlugin new]];
  [client addPlugin:[[FlipperKitNetworkPlugin alloc] initWithNetworkAdapter:[SKIOSNetworkAdapter new]]];
  [client start];
}
#endif

// Use same key as react-native-secure-key-store
// so we don't reset already working installs
static NSString * const kHasRunBeforeKey = @"RnSksIsAppInstalled";

static void SetCustomNSURLSessionConfiguration() {
  RCTSetCustomNSURLSessionConfigurationProvider(^NSURLSessionConfiguration *{
    NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
    
    NSDictionary *infoDictionary = NSBundle.mainBundle.infoDictionary;
    NSString *appVersion = [infoDictionary objectForKey:@"CFBundleShortVersionString"];
    UIDevice *device = UIDevice.currentDevice;
    // Format we want: Valora/1.0.0 (iOS 15.0; iPhone)
    NSString *userAgent = [NSString stringWithFormat:@"Valora/%@ (%@ %@; %@)", appVersion, device.systemName, device.systemVersion, device.model];
    configuration.HTTPAdditionalHeaders = @{ @"User-Agent": userAgent };
    
    return configuration;
  });
}

@interface AppDelegate ()

@property (nonatomic, weak) UIView *blurView;

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
#ifdef FB_SONARKIT_ENABLED
  InitializeFlipper(application);
#endif

  // Reset keychain on first run to clear existing Firebase credentials
  // Note: react-native-secure-key-store also does that but is run too late
  // and hence can't clear Firebase credentials
  [self resetKeychainIfNecessary];
  
  // IMPORTANT: Order matters here! This is because both CleverTap and Firebase swizzle AppDelegate/UNUserNotificationCenterDelegate methods
  // and only this specific order works! Also CleverTap account ID and token need to be provided via Info.plist
  // to have push with deep links handled correctly. Instead of via Segment remote config which happens too late in the init process.
  // 1. UNUserNotificationCenter set delegate
  // 2. CleverTap autoIntegrate
  // 3. Firebase configure
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  center.delegate = self;
  
#if DEBUG
  [CleverTap setDebugLevel:CleverTapLogDebug];
#endif
  [CleverTap autoIntegrate];
  [[CleverTapReactManager sharedInstance] applicationDidLaunchWithOptions:launchOptions];
  
  NSString *env = [RNCConfig envFor:@"FIREBASE_ENABLED"];
  if (env.boolValue) {
    [FIROptions defaultOptions].deepLinkURLScheme = @"celo";
    [FIRApp configure];
  }
  
  SetCustomNSURLSessionConfiguration();
  
  self.moduleName = @"celo";

  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  NSDate *now = [NSDate date];
  NSTimeInterval nowEpochSeconds = [now timeIntervalSince1970];
  NSNumber *nowEpochMs = @((long long)(nowEpochSeconds * 1000));

  self.initialProps = @{
    @"appStartedMillis": nowEpochMs
  };

  bool didFinish = [super application:application didFinishLaunchingWithOptions:launchOptions];
  
  [RNSplashScreen show];  // this needs to be called after [super application:application didFinishLaunchingWithOptions:launchOptions];
  
  return didFinish;
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feature is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
  return true;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

// Reset keychain on first app run, this is so we don't run with leftover items
// after reinstalling the app
- (void)resetKeychainIfNecessary
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


- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  BOOL handled = [RCTLinkingManager application:application openURL:url options:options];
  // Deeplink tracking in segment
  [AnalyticsReactNative trackDeepLink:url withOptions:options];  
  return handled;
}

- (void)applicationDidEnterBackground:(UIApplication *)application
{
  // Prevent sensitive information from appearing in the task switcher
  // See https://developer.apple.com/library/archive/qa/qa1838/_index.html
  
  if (self.blurView) {
    // Shouldn't happen ;)
    return;
  }
  
  UIVisualEffect *blurEffect = [UIBlurEffect effectWithStyle:UIBlurEffectStyleLight];
  UIVisualEffectView *blurView = [[UIVisualEffectView alloc] initWithEffect:blurEffect];
  blurView.frame = self.window.bounds;
  self.blurView = blurView;
  [self.window addSubview:blurView];
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
  // Remove our blur
  [self.blurView removeFromSuperview];
  self.blurView = nil;
}

// This is needed for CleverTap push to appear while the app is in foreground, using the system banner
// Note: this doesn't apply to push sent via FCM, which are handled on the React Native side
// See https://github.com/invertase/react-native-firebase/blob/0d22eadfbb2f4a9229c63393bc87dc838511a617/packages/messaging/ios/RNFBMessaging/RNFBMessaging%2BUNUserNotificationCenter.m#L86
- (void)userNotificationCenter:(UNUserNotificationCenter* )center willPresentNotification:(UNNotification* )notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler 
{
  NSLog(@"%@: will present notification: %@", self.description, notification.request.content.userInfo);
  [[CleverTap sharedInstance] recordNotificationViewedEventWithData:notification.request.content.userInfo];
  completionHandler(UNAuthorizationOptionAlert | UNAuthorizationOptionBadge | UNAuthorizationOptionSound);
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler{
    NSLog(@"%@: did receive remote notification completionhandler: %@", self.description, userInfo);
    completionHandler(UIBackgroundFetchResultNewData);
}

// This is also needed for CleverTap to have correct push actions handling, because of the swizzling competition between CleverTap and Firebase
- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler {
  completionHandler();
}

// Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
  return [RCTLinkingManager 
            application:application
            continueUserActivity:userActivity
            restorationHandler:restorationHandler
         ];
}

#if RCT_NEW_ARCH_ENABLED

#pragma mark - RCTCxxBridgeDelegate

- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  _turboModuleManager = [[RCTTurboModuleManager alloc] initWithBridge:bridge
                                                             delegate:self
                                                            jsInvoker:bridge.jsCallInvoker];
  return RCTAppSetupDefaultJsExecutorFactory(bridge, _turboModuleManager);
}

#pragma mark RCTTurboModuleManagerDelegate

- (Class)getModuleClassFromName:(const char *)name
{
  return RCTCoreModulesClassProvider(name);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  return nullptr;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                     initParams:
                                                         (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  return RCTAppSetupDefaultModuleFromClass(moduleClass);
}

#endif

@end

