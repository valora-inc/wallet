package xyz.mobilestack;

import android.content.Context;
import com.facebook.react.modules.network.OkHttpClientFactory;
import com.facebook.react.modules.network.OkHttpClientProvider;
import okhttp3.OkHttpClient;

public class UserAgentClientFactory implements OkHttpClientFactory {

  private Context context;

  public UserAgentClientFactory(Context context) {
    this.context = context;
  }

  public OkHttpClient createNewNetworkModuleClient() {
    return OkHttpClientProvider.createClientBuilder(this.context)
      .addInterceptor(new UserAgentInterceptor())
      .build();
  }
}
