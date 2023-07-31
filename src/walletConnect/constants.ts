import { TFunction } from 'i18next'

export enum SupportedActions {
  eth_signTransaction = 'eth_signTransaction',
  eth_sendTransaction = 'eth_sendTransaction',
  eth_signTypedData = 'eth_signTypedData',
  eth_signTypedData_v4 = 'eth_signTypedData_v4',
  eth_sign = 'eth_sign',
  personal_sign = 'personal_sign',
  personal_decrypt = 'personal_decrypt',
}

export enum SupportedEvents {
  accountsChanged = 'accountsChanged',
  chainChanged = 'chainChanged',
}

export function isSupportedAction(action: string) {
  return Object.values(SupportedActions).includes(action as SupportedActions)
}

export function isSupportedEvent(event: string) {
  return Object.values(SupportedEvents).includes(event as SupportedEvents)
}

export function getDescriptionFromAction(t: TFunction, action: SupportedActions, dappName: string) {
  const actionTranslations: { [x in SupportedActions]: string } = {
    [SupportedActions.eth_signTransaction]: t('walletConnectRequest.signTransaction', { dappName }),
    [SupportedActions.eth_sendTransaction]: t('walletConnectRequest.sendTransaction', { dappName }),
    [SupportedActions.eth_signTypedData]: t('walletConnectRequest.signPayload', { dappName }),
    [SupportedActions.eth_signTypedData_v4]: t('walletConnectRequest.signPayload', { dappName }),
    [SupportedActions.eth_sign]: t('walletConnectRequest.signPayload', { dappName }),
    [SupportedActions.personal_sign]: t('walletConnectRequest.signPayload', { dappName }),
    [SupportedActions.personal_decrypt]: t('walletConnectRequest.decryptPayload', { dappName }),
  }

  const translationId = actionTranslations[action]
  if (!translationId) {
    return ''
  }

  return translationId
}
