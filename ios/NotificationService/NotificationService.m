//
//  NotificationService.m
//  NotificationService
//
//  Created by Jean Regisser on 07/10/2021.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import "NotificationService.h"

@implementation NotificationService

- (void)didReceiveNotificationRequest:(UNNotificationRequest *)request withContentHandler:(void (^)(UNNotificationContent * _Nonnull))contentHandler {
    
    self.contentHandler = contentHandler;
    self.bestAttemptContent = [request.content mutableCopy];

    [[CleverTap sharedInstance] recordNotificationViewedEventWithData:request.content.userInfo];
    [super didReceiveNotificationRequest:request withContentHandler:contentHandler];
}

@end
