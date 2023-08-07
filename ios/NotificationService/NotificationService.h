//
//  NotificationService.h
//  NotificationService
//
//  Created by Jean Regisser on 07/10/2021.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import <CTNotificationService/CTNotificationService.h>
#import <CleverTap.h>

@interface NotificationService : CTNotificationServiceExtension

@property (nonatomic, strong) void (^contentHandler)(UNNotificationContent *contentToDeliver);
@property (nonatomic, strong) UNMutableNotificationContent *bestAttemptContent;

@end
