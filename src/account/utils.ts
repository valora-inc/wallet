import { ADDRESS_LENGTH } from 'src/exchange/reducer'

export const isAddressFormat = (content: string): boolean => {
  return content.startsWith('0x') && content.length === ADDRESS_LENGTH
}

export const emailFormatValidator = (email: string): string => {
  // @todo Email validation
  return email
}

export const passwordFormatValidator = (password: string): string => {
  // @todo Password validation
  return password
}
