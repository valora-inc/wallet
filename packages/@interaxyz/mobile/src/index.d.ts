declare module '*.json' {
  const value: any
  export default value
}

declare module '*.png'
declare module '*.jpg'

declare module 'dot-prop-immutable'
declare module 'svgs'
declare module 'react-native-languages'
declare module 'react-native-version-check'
declare module 'react-native-restart-android'
declare module 'react-native-platform-touchable'
declare module 'react-native-shake'
declare module 'numeral'
declare module 'redux-persist/lib/stateReconciler/autoMergeLevel2'
declare module 'redux-persist-fs-storage'
declare module 'futoin-hkdf'
declare module 'eth-lib'
declare module '@ungap/url-search-params'
declare module 'react-native-install-referrer'

// eslint-disable-next-line no-var
declare var nativeLoggingHook: (message: string, logLevel: number) => void
