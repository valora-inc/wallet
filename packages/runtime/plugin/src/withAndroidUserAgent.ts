// Inspired by https://github.com/expo/expo/blob/03e99016c9c5b9ad47864b204511ded2dec80375/packages/%40expo/config-plugins/src/ios/Maps.ts#L6
import { ConfigPlugin, withMainApplication } from '@expo/config-plugins'
import { mergeContents, MergeResults } from '@expo/config-plugins/build/utils/generateCode'

const NEEDED_IMPORTS = [
  'import android.os.Build',
  'import com.facebook.react.modules.network.OkHttpClientFactory',
  'import com.facebook.react.modules.network.OkHttpClientProvider',
  'import okhttp3.OkHttpClient',
  'import okhttp3.Interceptor',
  'import okhttp3.Request',
  'import okhttp3.Response',
]

function getUserAgentCode(appName: string) {
  return `
OkHttpClientProvider.setOkHttpClientFactory(object : OkHttpClientFactory {
    override fun createNewNetworkModuleClient(): OkHttpClient {
        return OkHttpClientProvider.createClientBuilder(this@MainApplication)
            .addInterceptor(Interceptor { chain ->
                val originalRequest = chain.request()
                val requestWithUserAgent = originalRequest
                    .newBuilder()
                    .removeHeader("User-Agent")
                    .addHeader(
                        "User-Agent",
                        "${appName}/%s (Android %s; %s)".format(
                            BuildConfig.VERSION_NAME,
                            Build.VERSION.RELEASE,
                            Build.MODEL
                        )
                    )
                    .build()
                chain.proceed(requestWithUserAgent)
            })
            .build()
    }
})
`
}

function addNeededImports(src: string): MergeResults {
  // filter out imports that are already present
  const imports = NEEDED_IMPORTS.filter((imp) => !src.includes(imp))

  return mergeContents({
    tag: '@mobilestack-xyz/runtime/main-application-user-agent-imports',
    src,
    newSrc: imports.join('\n'),
    anchor: /import com\.facebook\.soloader\.SoLoader/,
    offset: 1,
    comment: '//',
  })
}

function addUserAgentCode(src: string, appName: string): MergeResults {
  return mergeContents({
    tag: '@mobilestack-xyz/runtime/main-application-user-agent-code',
    src,
    newSrc: getUserAgentCode(appName),
    anchor: /ApplicationLifecycleDispatcher\.onApplicationCreate\(this\)/,
    offset: 0,
    comment: '//',
  })
}

/**
 * Config plugin for setting an app-wide User-Agent header for all requests
 * TODO: consider shipping this as a react native module
 */
export const withAndroidUserAgent: ConfigPlugin<{ appName?: string }> = (config, { appName }) => {
  return withMainApplication(config, (config) => {
    if (!['kt'].includes(config.modResults.language)) {
      throw new Error(
        `Cannot setup MobileStack runtime because the project MainApplication is not a supported language: ${config.modResults.language}`
      )
    }

    try {
      config.modResults.contents = addNeededImports(config.modResults.contents).contents
      config.modResults.contents = addUserAgentCode(
        config.modResults.contents,
        appName ?? config.name
      ).contents
    } catch (error: any) {
      if (error.code === 'ERR_NO_MATCH') {
        throw new Error(
          `Cannot add MobileStack runtime to the project's MainApplication because it's malformed. Please report this with a copy of your project MainApplication.`
        )
      }
      throw error
    }
    return config
  })
}
