// import styles from 'src/styles/styles'
import React, { useEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes } from 'src/components/Button'
import Touchable from 'src/components/Touchable'
import { fetchProviders, FiatExchangeFlow } from 'src/fiatExchanges/utils'
import Times from 'src/icons/Times'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

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

  const asyncRampInfo = useAsync(
    async () => {
      if (!account) {
        Logger.error(TAG, 'No account set')
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
        const rampProvider = providers?.find((provider) => provider.name === 'Ramp')
        const rampAvailable = !!(
          rampProvider &&
          rampProvider?.cashIn &&
          !rampProvider.restricted &&
          !rampProvider.unavailable
        )
        if (rampAvailable) {
          // This event can be used as an activation event to limit the experiment
          // analysis to users that have ramp available to them
          ValoraAnalytics.track(FiatExchangeEvents.cico_add_funds_bottom_sheet_ramp_available)
        }
        return {
          rampAvailable,
          rampURL: rampProvider?.url,
        }
      } catch (error) {
        Logger.error(TAG, 'Failed to fetch CICO providers', error)
      }
    },
    [],
    {
      onSuccess: () => setModalVisible(true),
      onError: () => setModalVisible(true),
    }
  )

  const { result: { rampAvailable = false, rampURL = '' } = {} } = asyncRampInfo

  const goToRamp = () => {
    onDismissBottomSheet()

    navigateToURI(rampURL)
    ValoraAnalytics.track(FiatExchangeEvents.cico_add_funds_bottom_sheet_ramp_selected)
  }

  const goToAddFunds = () => {
    onDismissBottomSheet()

    navigate(Screens.FiatExchangeCurrency, {
      flow: FiatExchangeFlow.CashIn,
    })
    ValoraAnalytics.track(FiatExchangeEvents.cico_add_funds_bottom_sheet_selected, {
      rampAvailable,
    })
  }

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
          <>
            <Text style={styles.title}>
              {t('cashInBottomSheet.titleRamp', {
                currency: localCurrency === LocalCurrencyCode.EUR ? Currency.Euro : Currency.Dollar,
              })}
            </Text>
            <Text style={styles.subtitle}>{t('cashInBottomSheet.subtitleRamp')}</Text>
            <Button
              text={t('cashInBottomSheet.addFunds')}
              size={BtnSizes.FULL}
              onPress={goToRamp}
              style={styles.addFundBtn}
              testID={'cashInBtnRamp'}
            />
          </>
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
    paddingHorizontal: 36,
  },
  addFundBtn: {
    marginHorizontal: 16,
    marginVertical: 28,
  },
})

export default CashInBottomSheet
