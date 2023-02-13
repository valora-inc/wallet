#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTHTTPRequestHandler.h>

@import Firebase;

#import "RNSplashScreen.h"
#import "ReactNativeConfig.h"

#import <React/RCTAppSetupUtils.h>

#import <UserNotifications/UserNotifications.h>
#import <CleverTapSDK/CleverTap.h>
#import <CleverTapReact/CleverTapReactManager.h>

#if RCT_NEW_ARCH_ENABLED
#import <React/CoreModulesPlugins.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <React/RCTFabricSurfaceHostingProxyRootView.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <ReactCommon/RCTTurboModuleManager.h>

#import <react/config/ReactNativeConfig.h>

@interface AppDelegate () <RCTCxxBridgeDelegate, RCTTurboModuleManagerDelegate> {
  RCTTurboModuleManager *_turboModuleManager;
  RCTSurfacePresenterBridgeAdapter *_bridgeAdapter;
  std::shared_ptr<const facebook::react::ReactNativeConfig> _reactNativeConfig;
  facebook::react::ContextContainer::Shared _contextContainer;
}
@end
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
    // Format we want: Valora/1.0.0 (iOS 14.5; iPhone)
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
  RCTAppSetupPrepareApp(application);

  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];

#if RCT_NEW_ARCH_ENABLED
  _contextContainer = std::make_shared<facebook::react::ContextContainer const>();
  _reactNativeConfig = std::make_shared<facebook::react::EmptyReactNativeConfig const>();
  _contextContainer->insert("ReactNativeConfig", _reactNativeConfig);
  _bridgeAdapter = [[RCTSurfacePresenterBridgeAdapter alloc] initWithBridge:bridge contextContainer:_contextContainer];
  bridge.surfacePresenter = _bridgeAdapter.surfacePresenter;
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
    [FIROptions defaultOptions].deepLinkURLScheme = @"celo";
    [FIRApp configure];
  }

  SetCustomNSURLSessionConfiguration();
  	
  NSDate *now = [NSDate date];
  NSTimeInterval nowEpochSeconds = [now timeIntervalSince1970];
  long long nowEpochMs = (long long)(nowEpochSeconds * 1000);
  NSDictionary *props = @{@"appStartedMillis" : @(nowEpochMs)};

  UIView *rootView = RCTAppSetupDefaultRootView(bridge, @"celo", nil);

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
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
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
