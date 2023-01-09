package org.celo.mobile;

import com.facebook.react.modules.network.OkHttpClientFactory;
import com.facebook.react.modules.network.OkHttpClientProvider;
import okhttp3.OkHttpClient;

public class UserAgentClientFactory implements OkHttpClientFactory {

  public OkHttpClient createNewNetworkModuleClient() {
    return OkHttpClientProvider
      .createClientBuilder()
      .addInterceptor(new UserAgentInterceptor())
      .build();
  }
}
