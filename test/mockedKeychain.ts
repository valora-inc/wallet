import * as Keychain from 'react-native-keychain'

// This is exposed via __mocks__
// @ts-ignore
export const mockedItems = Keychain.mockedItems

export function clearAllItems() {
  mockedItems.clear()
}

export function getAllKeys() {
  return Array.from(mockedItems.keys())
}

export function setItems(items: { [key: string]: any }) {
  Object.keys(items).forEach((key) => {
    mockedItems.set(key, items[key])
  })
}
