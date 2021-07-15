package org.celo.mobile;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import java.util.HashMap;
import java.util.Map;

public class GooglePlayServicesAvailability extends ReactContextBaseJavaModule {

  GooglePlayServicesAvailability(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "GooglePlayServicesAvailabilityModule";
  }

  @ReactMethod
  public void isGooglePlayServicesAvailable(Promise promise) {
    try {
      final int code = GoogleApiAvailability
        .getInstance()
        .isGooglePlayServicesAvailable(this.getCurrentActivity());
      final ConnectionResult result = new ConnectionResult(code);
      promise.resolve(result.getErrorCode());
    } catch (Exception e) {
      promise.reject(
        "GooglePlayServicesAvailability Error",
        "Error checking Google Play Services availability",
        e
      );
    }
  }
}
