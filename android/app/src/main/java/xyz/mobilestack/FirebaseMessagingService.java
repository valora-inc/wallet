package xyz.mobilestack;

import android.os.Bundle;
import android.util.Log;
import com.clevertap.android.sdk.CleverTapAPI;
import com.clevertap.android.sdk.pushnotification.NotificationInfo;
import com.google.firebase.messaging.RemoteMessage;
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService;
import java.util.Map;

public class FirebaseMessagingService extends ReactNativeFirebaseMessagingService {

  static final String TAG = "FirebaseMessagingService";

  @Override
  public void onMessageReceived(RemoteMessage message) {
    try {
      if (message.getData().size() > 0) {
        Bundle extras = new Bundle();
        for (Map.Entry<String, String> entry : message.getData().entrySet()) {
          extras.putString(entry.getKey(), entry.getValue());
        }
        NotificationInfo info = CleverTapAPI.getNotificationInfo(extras);
        if (info.fromCleverTap) {
          // over here got is channel id which you will have to use while sending push notification from CleverTap Dashboard
          //and this is required for Android Os 8.0 and above.
          CleverTapAPI.createNotification(getApplicationContext(), extras);
        } else {
          // not from CleverTap handle yourself or pass to another provider
          super.onMessageReceived(message);
        }
      }
    } catch (Throwable t) {
      Log.e(TAG, "Error parsing FCM message", t);
    }
  }
}
