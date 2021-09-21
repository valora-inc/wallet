import i18n from 'src/i18n'

export enum SupportedActions {
  // TODO: add back when implemented
  // eth_accounts = 'eth_accounts',
  eth_signTransaction = 'eth_signTransaction',
  eth_sendTransaction = 'eth_sendTransaction',
  eth_signTypedData = 'eth_signTypedData',
  eth_sign = 'eth_sign',
  personal_sign = 'personal_sign',
  personal_decrypt = 'personal_decrypt',
  // TODO: add back when implemented
  // computeSharedSecret = 'personal_computeSharedSecret',
}

const actionDescriptionTranslations: { [action in SupportedActions]: string } = {
  // [SupportedActions.eth_accounts]: i18n.t('walletConnect:description.accounts'),
  [SupportedActions.eth_signTransaction]: i18n.t('walletConnect:description.signTransaction'),
  [SupportedActions.eth_sendTransaction]: i18n.t('walletConnect:description.sendTransaction'),
  [SupportedActions.eth_signTypedData]: i18n.t('walletConnect:description.sign'),
  [SupportedActions.eth_sign]: i18n.t('walletConnect:description.sign'),
  [SupportedActions.personal_sign]: i18n.t('walletConnect:description.sign'),
  [SupportedActions.personal_decrypt]: i18n.t('walletConnect:description.decrypt'),
  // [SupportedActions.computeSharedSecret]: i18n.t('walletConnect:description.computeSharedSecret'),
}

const actionTranslations: { [x in SupportedActions]: string } = {
  // [SupportedActions.eth_accounts]: i18n.t('walletConnect:action.accounts'),
  [SupportedActions.eth_signTransaction]: i18n.t('walletConnect:action.signTransaction'),
  [SupportedActions.eth_sendTransaction]: i18n.t('walletConnect:action.sendTransaction'),
  [SupportedActions.eth_signTypedData]: i18n.t('walletConnect:action.sign'),
  [SupportedActions.eth_sign]: i18n.t('walletConnect:action.sign'),
  [SupportedActions.personal_sign]: i18n.t('walletConnect:action.sign'),
  [SupportedActions.personal_decrypt]: i18n.t('walletConnect:action.decrypt'),
  // [SupportedActions.computeSharedSecret]: i18n.t('walletConnect:action.computeSharedSecret'),
}

export function getTranslationDescriptionFromAction(action: SupportedActions) {
  const translationId = actionDescriptionTranslations[action]
  if (!translationId) {
    throw new Error(`Unsupported action ${action}`)
  }

  return translationId
}

export function getTranslationFromAction(action: SupportedActions) {
  const translationId = actionTranslations[action]
  if (!translationId) {
    throw new Error(`Unsupported action ${action}`)
  }

  return translationId
}
