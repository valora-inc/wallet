import Button, { BtnSizes } from '@celo/react-components/components/Button'
import Touchable from '@celo/react-components/components/Touchable'
import Times from '@celo/react-components/icons/Times'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
// import styles from '@celo/react-components/styles/styles'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import useSelector from 'src/redux/useSelector'
import { currentAccountSelector } from 'src/web3/selectors'
import Logger from 'src/utils/Logger'
import { fetchProviders } from 'src/fiatExchanges/utils'
import { useAsync } from 'react-async-hook'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { CiCoCurrency } from 'src/utils/currencies'
import { navigateToURI } from 'src/utils/linking'

const TAG = 'CashInBottomSheet'

function CashInBottomSheet() {
  const { t } = useTranslation()
  const [isModalVisible, setModalVisible] = useState(false)

  const userLocation = useSelector(userLocationDataSelector)
  const account = useSelector(currentAccountSelector)
  const localCurrency = useSelector(getLocalCurrencyCode)
  const rampCashInButtonExpEnabled = useSelector((state) => state.app.rampCashInButtonExpEnabled)

  useEffect(() => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_add_funds_bottom_sheet_impression)
  }, [])

  const onDismissBottomSheet = () => {
    setModalVisible(false)
  }

  const goToAddFunds = () => {
    onDismissBottomSheet()

    navigate(Screens.FiatExchangeOptions, {
      isCashIn: true,
    })
    ValoraAnalytics.track(FiatExchangeEvents.cico_add_funds_bottom_sheet_selected)
  }

  const asyncProviders = useAsync(async () => {
    if (!account) {
      Logger.error(TAG, 'No account set')
      setModalVisible(true)
      return
    }
    // Use cEUR if that is their local currency, otherwise default to cUSD
    const currencyToBuy =
      localCurrency === LocalCurrencyCode.EUR ? CiCoCurrency.CEUR : CiCoCurrency.CUSD

    try {
      const providers = await fetchProviders({
        userLocation,
        walletAddress: account,
        fiatCurrency: localCurrency,
        digitalAsset: currencyToBuy,
        fiatAmount: 20,
        digitalAssetAmount: 20,
        txType: 'buy',
      })
      setModalVisible(true)
      return providers
    } catch (error) {
      setModalVisible(true)
      console.debug('FAILED', error)
    }
  }, [])

  const rampProvider = asyncProviders.result?.find((provider) => provider.name === 'Ramp')
  const rampAvailable =
    rampProvider &&
    rampProvider?.cashIn &&
    !rampProvider.restricted &&
    rampProvider.url &&
    !rampProvider.unavailable

  const goToRamp = () => {
    onDismissBottomSheet()

    rampAvailable && rampProvider?.url && navigateToURI(rampProvider.url)
    ValoraAnalytics.track(FiatExchangeEvents.cico_add_funds_bottom_sheet_ramp)
  }
  console.debug(rampProvider, rampAvailable)
  return (
    <Modal
      animationIn="slideInUp"
      animationInTiming={800}
      isVisible={isModalVisible}
      swipeDirection="down"
      style={styles.overlay}
      onBackdropPress={onDismissBottomSheet}
      onSwipeComplete={onDismissBottomSheet}
    >
      <View style={styles.container}>
        <Touchable
          style={styles.dismissButton}
          onPress={onDismissBottomSheet}
          borderless={true}
          hitSlop={variables.iconHitslop}
        >
          <Times />
        </Touchable>
        {rampAvailable && rampCashInButtonExpEnabled ? (
          <View>
            <Text style={styles.title}>{'Add [cUSD] to start using Valora'}</Text>
            <Text style={styles.subtitle}>
              {'Add funds with zero fees through one of our trusted external providers.'}
            </Text>
            <Button
              text={t('cashInBottomSheet.addFunds')}
              size={BtnSizes.FULL}
              onPress={goToRamp}
              style={styles.addFundBtn}
              testID={'cashInBtn'}
            />
          </View>
        ) : (
          <View>
            <Text style={styles.title}>{t('cashInBottomSheet.title')}</Text>
            <Text style={styles.subtitle}>{t('cashInBottomSheet.subtitle')}</Text>
            <Button
              text={t('cashInBottomSheet.addFunds')}
              size={BtnSizes.FULL}
              onPress={goToAddFunds}
              style={styles.addFundBtn}
              testID={'cashInBtn'}
            />
          </View>
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  container: {
    paddingTop: 12,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    backgroundColor: 'white',
  },
  dismissButton: {
    backgroundColor: 'transparent',
    marginVertical: 26,
    marginRight: 26,
    alignItems: 'flex-end',
  },
  title: {
    ...fontStyles.h2,
    textAlign: 'center',
    paddingHorizontal: 36,
    marginBottom: 16,
  },
  subtitle: {
    ...fontStyles.regular,
    textAlign: 'center',
    color: colors.gray5,
  },
  addFundBtn: {
    marginHorizontal: 16,
    marginVertical: 28,
  },
})

export default CashInBottomSheet
