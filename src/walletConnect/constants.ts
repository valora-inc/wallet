import { TFunction } from 'i18next'

export enum SupportedActions {
  eth_signTransaction = 'eth_signTransaction',
  eth_sendTransaction = 'eth_sendTransaction',
  eth_signTypedData = 'eth_signTypedData',
  eth_signTypedData_v4 = 'eth_signTypedData_v4',
  eth_sign = 'eth_sign',
  personal_sign = 'personal_sign',
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

export function getDescriptionAndTitleFromAction(
  t: TFunction,
  action: SupportedActions,
  dappName: string
): { description: string; title: string } {
  const actionTranslations: { [x in SupportedActions]: { description: string; title: string } } = {
    [SupportedActions.eth_signTransaction]: {
      description: t('walletConnectRequest.signTransaction', { dappName }),
      title: t('walletConnectRequest.signTransactionTitle'),
    },
    [SupportedActions.eth_sendTransaction]: {
      description: t('walletConnectRequest.sendTransaction', { dappName }),
      title: t('walletConnectRequest.sendTransactionTitle'),
    },
    [SupportedActions.eth_signTypedData]: {
      description: t('walletConnectRequest.signPayload', { dappName }),
      title: t('walletConnectRequest.signPayloadTitle'),
    },
    [SupportedActions.eth_signTypedData_v4]: {
      description: t('walletConnectRequest.signPayload', { dappName }),
      title: t('walletConnectRequest.signPayloadTitle'),
    },
    [SupportedActions.eth_sign]: {
      description: t('walletConnectRequest.signPayload', { dappName }),
      title: t('walletConnectRequest.signPayloadTitle'),
    },
    [SupportedActions.personal_sign]: {
      description: t('walletConnectRequest.signPayload', { dappName }),
      title: t('walletConnectRequest.signPayloadTitle'),
    },
  }

  const translations = actionTranslations[action]
  if (!translations) {
    return { description: '', title: '' }
  }

  return translations
}
