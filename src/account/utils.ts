import { ADDRESS_LENGTH } from 'src/exchange/reducer'

export const isAddressFormat = (content: string): boolean => {
  return content.startsWith('0x') && content.length === ADDRESS_LENGTH
}

export const emailFormatValidator = (email: string): string => {
  // @audit Email validation
  return email
}

export const passwordFormatValidator = (password: string): string => {
  // @audit Password validation
  return password
}
