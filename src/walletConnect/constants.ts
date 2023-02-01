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

export function isSupportedAction(action: string) {
  return Object.values(SupportedActions).includes(action as SupportedActions)
}

export function getTranslationDescriptionFromAction(t: TFunction, action: SupportedActions) {
  const actionDescriptionTranslations: { [action in SupportedActions]: string } = {
    [SupportedActions.eth_accounts]: t('description.accounts'),
    [SupportedActions.eth_signTransaction]: t('description.signTransaction'),
    [SupportedActions.eth_sendTransaction]: t('description.sendTransaction'),
    [SupportedActions.eth_signTypedData]: t('description.sign'),
    [SupportedActions.eth_signTypedData_v4]: t('description.sign'),
    [SupportedActions.eth_sign]: t('description.sign'),
    [SupportedActions.personal_sign]: t('description.sign'),
    [SupportedActions.personal_decrypt]: t('description.decrypt'),
    [SupportedActions.computeSharedSecret]: t('description.computeSharedSecret'),
  }

  const translationId = actionDescriptionTranslations[action]
  if (!translationId) {
    return ''
  }

  return translationId
}

export function getDescriptionFromAction(t: TFunction, action: SupportedActions, dappName: string) {
  const actionTranslations: { [x in SupportedActions]: string } = {
    [SupportedActions.eth_accounts]: t('walletConnectRequest.readAccount', { dappName }),
    [SupportedActions.eth_signTransaction]: t('walletConnectRequest.signTransaction', { dappName }),
    [SupportedActions.eth_sendTransaction]: t('walletConnectRequest.sendTransaction', { dappName }),
    [SupportedActions.eth_signTypedData]: t('walletConnectRequest.signPayload', { dappName }),
    [SupportedActions.eth_signTypedData_v4]: t('walletConnectRequest.signPayload', { dappName }),
    [SupportedActions.eth_sign]: t('walletConnectRequest.signPayload', { dappName }),
    [SupportedActions.personal_sign]: t('walletConnectRequest.signPayload', { dappName }),
    [SupportedActions.personal_decrypt]: t('walletConnectRequest.decryptPayload', { dappName }),
    [SupportedActions.computeSharedSecret]: t('walletConnectRequest.computeSharedSecret', {
      dappName,
    }),
  }

  const translationId = actionTranslations[action]
  if (!translationId) {
    return ''
  }

  return translationId
}
