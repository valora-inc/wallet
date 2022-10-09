/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLinkingManager.h>

@import Firebase;

#import "RNSplashScreen.h"
#import "ReactNativeConfig.h"

#import <CodePush/CodePush.h>
#import <AppCenterReactNative.h>
#import <AppCenterReactNativeAnalytics.h>
#import <AppCenterReactNativeCrashes.h>

#ifdef FB_SONARKIT_ENABLED
#import <FlipperKit/FlipperClient.h>
#import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h>
#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>
#import <FlipperKitReactPlugin/FlipperKitReactPlugin.h>

#import <UserNotifications/UserNotifications.h>

#import <CleverTapSDK/CleverTap.h>
#import <CleverTapReact/CleverTapReactManager.h>

static void InitializeFlipper(UIApplication *application) {
  FlipperClient *client = [FlipperClient sharedClient];
  SKDescriptorMapper *layoutDescriptorMapper = [[SKDescriptorMapper alloc] initWithDefaults];
  [client addPlugin:[[FlipperKitLayoutPlugin alloc] initWithRootNode:application withDescriptorMapper:layoutDescriptorMapper]];
  [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]];
  [client addPlugin:[FlipperKitReactPlugin new]];
  [client addPlugin:[[FlipperKitNetworkPlugin alloc] initWithNetworkAdapter:[SKIOSNetworkAdapter new]]];
  [client start];
}
#endif

// Use same key as react-native-secure-key-store
// so we don't reset already working installs
static NSString * const kHasRunBeforeKey = @"RnSksIsAppInstalled";

@interface AppDelegate ()

@property (nonatomic, weak) UIView *blurView;

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [AppCenterReactNative register];
  [AppCenterReactNativeAnalytics registerWithInitiallyEnabled:true];
  [AppCenterReactNativeCrashes registerWithAutomaticProcessing];

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
  
  NSString *env = [ReactNativeConfig envFor:@"FIREBASE_ENABLED"];
  if (env.boolValue) {
    [FIROptions defaultOptions].deepLinkURLScheme = @"kolektivo";
    [FIRApp configure];
  }
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];

  NSDate *now = [NSDate date];
  NSTimeInterval nowEpochSeconds = [now timeIntervalSince1970];
  long long nowEpochMs = (long long)(nowEpochSeconds * 1000);
  NSDictionary *props = @{@"appStartedMillis" : @(nowEpochMs)};

  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"celo"
                                            initialProperties:props];
  
  [RNSplashScreen showSplash:@"LaunchScreen" inRootView:rootView];
  if (@available(iOS 13.0, *)) {
      rootView.backgroundColor = [UIColor systemBackgroundColor];
  } else {
      rootView.backgroundColor = [UIColor whiteColor];
  }
  
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [CodePush bundleURL];
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
  completionHandler(UNAuthorizationOptionAlert | UNAuthorizationOptionBadge | UNAuthorizationOptionSound);
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

@end
