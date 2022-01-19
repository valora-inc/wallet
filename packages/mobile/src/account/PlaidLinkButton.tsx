import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, StyleSheet } from 'react-native'
import { openLink } from 'react-native-plaid-link-sdk'
import { useDispatch, useSelector } from 'react-redux'
import { e164NumberSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { createLinkToken } from 'src/in-house-liquidity'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'
import {
  dataEncryptionKeySelector,
  mtwAddressSelector,
  walletAddressSelector,
} from 'src/web3/selectors'

const TAG = 'PLAID'

const PlaidLinkButton = ({ disabled }: { disabled: boolean }) => {
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const accountMTWAddress = useSelector(mtwAddressSelector)
  const walletAddress = useSelector(walletAddressSelector)
  const dekPrivate = useSelector(dataEncryptionKeySelector)
  const locale = useSelector(currentLanguageSelector) || ''
  const phoneNumber = useSelector(e164NumberSelector) || ''
  const isAndroid = Platform.OS === 'android'

  const onPress = async () => {
    if (!accountMTWAddress) {
      Logger.warn(TAG, "Can't render Plaid because accountMTWAddress is null")
      return
    }
    if (!walletAddress) {
      Logger.error(TAG, "Can't render Plaid because walletAddress is null")
      return
    }
    if (!dekPrivate) {
      Logger.error(TAG, "Can't render Plaid because dekPrivate is null")
      return
    }
    const linkTokenResponse = await createLinkToken({
      accountMTWAddress,
      dekPrivate,
      isAndroid,
      language: locale.split('-')[0], // ex: just en, not en-US
      phoneNumber,
    })
    if (!linkTokenResponse.ok) {
      dispatch(showError(ErrorMessages.PLAID_CREATE_LINK_TOKEN_FAIL))
      return
    }
    const { linkToken } = await linkTokenResponse.json()
    return openLink({
      tokenConfig: { token: linkToken },
      onSuccess: async ({ publicToken }) => {
        navigate(Screens.SyncBankAccountScreen, {
          publicToken,
        })
      },
      onExit: () => {
        // TODO(wallet#1447): handle errors from onExit
      },
    })
  }
  return (
    <Button
      style={styles.button}
      onPress={onPress}
      text={t('linkBankAccountScreen.stepTwo.cta')}
      type={BtnTypes.SECONDARY}
      size={BtnSizes.MEDIUM}
      testID="PlaidLinkButton"
      disabled={disabled || !accountMTWAddress || !walletAddress}
    />
  )
}

const styles = StyleSheet.create({
  button: {
    marginTop: 48,
  },
})

export default PlaidLinkButton
