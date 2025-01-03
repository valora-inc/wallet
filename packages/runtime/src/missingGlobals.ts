// Without this, one will see a confusing error
// similar to https://imgur.com/a/7rnLIh5
import { install } from 'react-native-quick-crypto'
import 'react-native-url-polyfill/auto'

export interface Global {
  URL: any
  self: any
}

// eslint-disable-next-line no-var
declare var global: Global
if (typeof global.self === 'undefined') {
  global.self = global
}

install()
