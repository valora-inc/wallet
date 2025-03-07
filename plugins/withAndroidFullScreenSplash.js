const path = require('path')
const { ensureDirSync, copySync, existsSync } = require('fs-extra')
const {
  withAndroidManifest,
  withAndroidStyles,
  AndroidConfig,
  createRunOncePlugin,
  withPlugins,
  withDangerousMod,
  XML,
  WarningAggregator,
} = require('@expo/config-plugins')

const TAG = 'withAndroidFullScreenSplash'

const withAndroidFullScreenSplash = (config, { splashAssetsPath }) => {
  if (!splashAssetsPath) {
    throw new Error(
      'Missing required parameter "splashAssetsPath". This should be a path to the directory containing splash screen assets.'
    )
  }

  if (!existsSync(splashAssetsPath)) {
    throw new Error(`Splash assets directory does not exist: ${splashAssetsPath}`)
  }

  return withPlugins(config, [
    withAndroidManifestThemeUpdate,
    withFullScreenSplashStyle,
    withFullScreenSplashDrawable,
    (config) => withCopyAssets(config, { splashAssetsPath }),
  ])
}

// Update the theme attribute in the main activity
const withAndroidManifestThemeUpdate = (config) => {
  return withAndroidManifest(config, (config) => {
    try {
      config.modResults.manifest.application?.forEach((application) => {
        if (application.$['android:name'] === '.MainApplication') {
          application.activity?.forEach((activity) => {
            if (activity.$['android:name'] === '.MainActivity') {
              activity.$['android:theme'] = '@style/FullScreenSplash'
            }
          })
        }
      })

      return config
    } catch (e) {
      WarningAggregator.addWarningAndroid(TAG, `Failed to update AndroidManifest.xml: ${e.message}`)
      return config
    }
  })
}

// Add custom FullScreenSplash style to styles.xml
const withFullScreenSplashStyle = (config) => {
  return withAndroidStyles(config, (config) => {
    try {
      const styles = config.modResults

      styles.resources.style = [
        ...(styles.resources.style ?? []),
        {
          $: {
            name: 'FullScreenSplash',
            parent: 'Theme.AppCompat.Light.NoActionBar',
          },
          item: [
            { $: { name: 'android:windowBackground' }, _: '@drawable/fullscreen_splash' },
            { $: { name: 'android:windowFullscreen' }, _: 'true' },
            { $: { name: 'android:windowDisablePreview' }, _: 'true' },
            { $: { name: 'android:windowDrawsSystemBarBackgrounds' }, _: 'true' },
            { $: { name: 'android:statusBarColor' }, _: '@android:color/transparent' },
            { $: { name: 'android:windowTranslucentNavigation' }, _: 'true' },
            { $: { name: 'android:windowLayoutInDisplayCutoutMode' }, _: 'shortEdges' },
          ],
        },
      ]

      return config
    } catch (e) {
      WarningAggregator.addWarningAndroid(TAG, `Failed to update styles.xml: ${e.message}`)
      return config
    }
  })
}

// Create fullscreen_splash.xml in the drawable directory
const withFullScreenSplashDrawable = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      try {
        const filePath = await AndroidConfig.Paths.getResourceXMLPathAsync(
          config.modRequest.projectRoot,
          {
            name: 'fullscreen_splash',
            kind: 'drawable',
          }
        )

        const xmlContent = {
          'layer-list': {
            $: {
              'xmlns:android': 'http://schemas.android.com/apk/res/android',
            },
            item: [
              {
                bitmap: [
                  {
                    $: {
                      'android:src': '@drawable/splash_background',
                    },
                  },
                ],
              },
              {
                bitmap: [
                  {
                    $: {
                      'android:gravity': 'center',
                      'android:src': '@drawable/logo',
                    },
                  },
                ],
              },
            ],
          },
        }

        await XML.writeXMLAsync({
          path: filePath,
          xml: xmlContent,
        })

        return config
      } catch (e) {
        WarningAggregator.addWarningAndroid(
          TAG,
          `Failed to create fullscreen_splash.xml in the drawable directory: ${e.message}`
        )
        return config
      }
    },
  ])
}

// Copy splash assets to android/app/src/main/res
const withCopyAssets = (config, { splashAssetsPath }) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      try {
        const projectRoot = config.modRequest.projectRoot
        const resDir = await AndroidConfig.Paths.getResourceFolderAsync(projectRoot)

        ensureDirSync(resDir)

        copySync(splashAssetsPath, resDir, { overwrite: true })

        return config
      } catch (e) {
        WarningAggregator.addWarningAndroid(TAG, `Failed to copy splash assets: ${e.message}`)
        return config
      }
    },
  ])
}

module.exports = createRunOncePlugin(withAndroidFullScreenSplash, TAG)
