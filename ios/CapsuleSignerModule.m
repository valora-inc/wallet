//
//  CapsuleSignerModule.m
//
//  Created by Michał Osadnik on 14/12/2022.
//

#import <Foundation/Foundation.h>
#import "CapsuleSignerModule.h"
#import <Signer/Signer.h>
#import <CommonCrypto/CommonCrypto.h>

static NSString *configBase = @"{\"ServerUrl\": \"%@\", \"WalletId\": \"%@\", \"Id\":\"%@\", \"Ids\":%@, \"Threshold\":1}";

static NSString *ids = @"[\"USER\",\"CAPSULE\",\"RECOVERY\"]";

@implementation CapsuleSignerModule {
  NSString *_serverUrl;
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(setServerUrl: (NSString *) serverUrl) {
  _serverUrl = serverUrl;
}

// Get Address
- (void) invokeSignerGetAddress:(NSDictionary*)params
{
  NSString* serializedSigner = [params objectForKey:@"serializedSigner"];
  RCTPromiseResolveBlock resolve = [params objectForKey:@"resolve"];

  NSString* res = SignerGetAddress(serializedSigner);
  resolve(res);
}

RCT_EXPORT_METHOD(getAddress:(NSString *)serializedSigner
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSDictionary* params = [NSDictionary dictionaryWithObjectsAndKeys:
                          resolve, @"resolve",
                          serializedSigner, @"serializedSigner",
                          nil];
  [self performSelectorInBackground:@selector(invokeSignerGetAddress:)
                         withObject:params];
}

// Send Transaction
- (void) invokeSignerSendTransaction:(NSDictionary*)params
{
  NSString* serializedSigner = [params objectForKey:@"serializedSigner"];
  NSString* transaction = [params objectForKey:@"transaction"];
  NSString* protocolId = [params objectForKey:@"protocolId"];
  RCTPromiseResolveBlock resolve = [params objectForKey:@"resolve"];
  
  NSString* res = SignerSendTransaction(_serverUrl, serializedSigner, transaction, protocolId);
  resolve(res);
}

RCT_EXPORT_METHOD(sendTransaction:(NSString*)protocolId
                  serializedSigner:(NSString *)serializedSigner
                  transaction:(NSString *)transaction
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

{
  NSDictionary* params = [NSDictionary dictionaryWithObjectsAndKeys:
                          resolve, @"resolve",
                          serializedSigner, @"serializedSigner",
                          transaction, @"transaction",
                          protocolId, @"protocolId",
                          nil];
  [self performSelectorInBackground:@selector(invokeSignerSendTransaction:)
                         withObject:params];
}

// Create Account
- (void) invokeSignerCreateAccount:(NSDictionary*)params
{
  NSString* protocolId = [params objectForKey:@"protocolId"];
  NSString* signerConfig = [params objectForKey:@"signerConfig"];
  RCTPromiseResolveBlock resolve = [params objectForKey:@"resolve"];
  NSString* res = SignerCreateAccount(_serverUrl,signerConfig, protocolId);
  
  resolve(res);
}

RCT_EXPORT_METHOD(createAccount:(NSString *)walletId
                  protocolId:(NSString *)protocolId
                  userId:(NSString *)userId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString* signerConfig = [NSString stringWithFormat: configBase, _serverUrl, walletId, userId, ids];
  NSDictionary* params = [NSDictionary dictionaryWithObjectsAndKeys:
                          protocolId, @"protocolId",
                          resolve, @"resolve",
                          signerConfig, @"signerConfig",
                          nil];
  
  
  [self performSelectorInBackground:@selector(invokeSignerCreateAccount:)
                         withObject:params];
}

@end
