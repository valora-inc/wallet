import { TFunction } from 'i18next'

export enum SupportedActions {
  eth_accounts = 'eth_accounts',
  eth_signTransaction = 'eth_signTransaction',
  eth_sendTransaction = 'eth_sendTransaction',
  eth_signTypedData = 'eth_signTypedData',
  eth_signTypedData_v4 = 'eth_signTypedData_v4',
  eth_sign = 'eth_sign',
  personal_sign = 'personal_sign',
  personal_decrypt = 'personal_decrypt',
  computeSharedSecret = 'personal_computeSharedSecret',
}

const actionDescriptionTranslations: { [action in SupportedActions]: string } = {
  [SupportedActions.eth_accounts]: 'description.accounts',
  [SupportedActions.eth_signTransaction]: 'description.signTransaction',
  [SupportedActions.eth_sendTransaction]: 'description.sendTransaction',
  [SupportedActions.eth_signTypedData]: 'description.sign',
  [SupportedActions.eth_signTypedData_v4]: 'description.sign',
  [SupportedActions.eth_sign]: 'description.sign',
  [SupportedActions.personal_sign]: 'description.sign',
  [SupportedActions.personal_decrypt]: 'description.decrypt',
  [SupportedActions.computeSharedSecret]: 'description.computeSharedSecret',
}

const actionTranslations: { [x in SupportedActions]: string } = {
  [SupportedActions.eth_accounts]: 'action.accounts',
  [SupportedActions.eth_signTransaction]: 'action.signTransaction',
  [SupportedActions.eth_sendTransaction]: 'action.sendTransaction',
  [SupportedActions.eth_signTypedData]: 'action.sign',
  [SupportedActions.eth_signTypedData_v4]: 'action.sign',
  [SupportedActions.eth_sign]: 'action.sign',
  [SupportedActions.personal_sign]: 'action.sign',
  [SupportedActions.personal_decrypt]: 'action.decrypt',
  [SupportedActions.computeSharedSecret]: 'action.computeSharedSecret',
}

export function isSupportedAction(action: string) {
  return action in actionTranslations
}

export function getTranslationDescriptionFromAction(t: TFunction, action: SupportedActions) {
  const translationId = actionDescriptionTranslations[action]
  if (!translationId) {
    return ''
  }

  return t(translationId)
}

export function getTranslationFromAction(t: TFunction, action: SupportedActions) {
  const translationId = actionTranslations[action]
  if (!translationId) {
    return ''
  }

  return t(translationId)
}
