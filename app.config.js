import { exec } from 'shelljs'
import { version } from './package.json'

export default ({ config }) => {
  const commitUnixTime = exec('git show -s --format=%ct', { silent: true }).toString().trim()

  const name = process.env.APP_DISPLAY_NAME
  // const slug = process.env.APP_VARIANT!
  const bundleId = process.env.APP_BUNDLE_ID

  return {
    ...config,
    slug: 'valora',
    name,
    version,
    ios: {
      ...config.ios,
      bundleIdentifier: bundleId,
      buildNumber: commitUnixTime,
    },
    android: {
      ...config.android,
      package: bundleId,
      versionCode: Number(commitUnixTime) || 123,
    },
    extra: {
      eas: {
        projectId: '9428af71-4fd9-462d-bf0b-a99b128a82a1',
      },
    },
    owner: 'intera',
  }
}
