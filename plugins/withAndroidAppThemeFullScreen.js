const {
  withAndroidStyles,
  createRunOncePlugin,
  WarningAggregator,
} = require('@expo/config-plugins')

const TAG = 'withAppThemeFullScreen'

const withAndroidAppThemeFullScreen = (config) => {
  return withAndroidStyles(config, (config) => {
    try {
      const styles = config.modResults

      // Find existing AppTheme
      const appTheme = styles.resources.style?.find((style) => style.$?.name === 'AppTheme')

      if (!appTheme) {
        WarningAggregator.addWarningAndroid(
          TAG,
          'AppTheme not found in styles.xml. The windowFullscreen setting is not added. The splash screen may not display correctly.'
        )
        return config
      }

      // Add windowFullscreen if not already present
      if (!appTheme.item?.some((item) => item.$?.name === 'android:windowFullscreen')) {
        appTheme.item = [
          ...(appTheme.item ?? []),
          { $: { name: 'android:windowFullscreen' }, _: 'true' },
        ]
      }

      return config
    } catch (e) {
      WarningAggregator.addWarningAndroid(
        TAG,
        `Failed to update AppTheme in styles.xml: ${e.message}`
      )
      return config
    }
  })
}

module.exports = createRunOncePlugin(withAndroidAppThemeFullScreen, TAG)
