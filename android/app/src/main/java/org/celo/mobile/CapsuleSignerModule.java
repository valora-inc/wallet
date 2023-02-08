package org.celo.mobile;

import android.util.Log;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import signer.Signer;

public class CapsuleSignerModule extends ReactContextBaseJavaModule {
  static final String TAG = "CapsuleSignerModule";

  String ids = "[\"USER\",\"CAPSULE\",\"RECOVERY\"]";
  String serverUrl;
  String configBase =
    "{\"ServerUrl\": \"%s\", \"WalletId\": \"%s\", \"Id\":\"%s\", \"Ids\":%s, \"Threshold\":1}";

  CapsuleSignerModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "CapsuleSignerModule";
  }

  @ReactMethod
  public void setServerUrl(String serverUrl) {
    this.serverUrl = serverUrl;
  }

  /**
   * Perform distributed key generation with the Capsule server
   *
   * @param protocolId
   * @return
   */
  @ReactMethod
  public void createAccount(String walletId, String protocolId, String id, Promise promise) {
    String signerConfig = String.format(configBase, serverUrl, walletId, id, ids);
    (
      new Thread(
        () -> {
          String res = Signer.createAccount(serverUrl, signerConfig, protocolId);
          promise.resolve(res);
        }
      )
    ).start();
  }

  @ReactMethod
  public void getAddress(String serializedSigner, Promise promise) {
    (
      new Thread(
        () -> {
          String res = Signer.getAddress(serializedSigner);
          promise.resolve(res);
        }
      )
    ).start();
  }

  @ReactMethod
  public void sendTransaction(
    String protocolId,
    String serializedSigner,
    String transaction,
    Promise promise
  ) {
    (
      new Thread(
        () -> {
          String res = Signer.sendTransaction(serverUrl, serializedSigner, transaction, protocolId);
          promise.resolve(res);
        }
      )
    ).start();
  }
}
