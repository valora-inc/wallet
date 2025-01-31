import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Touchable from 'src/components/Touchable'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'

interface Props {
  forwardedRef: React.RefObject<BottomSheetModalRefType>
  onClose: () => void
  onExchangeSelected: (exchange: ExternalExchangeProvider) => void
  exchanges: ExternalExchangeProvider[]
}

function ExchangeOption({
  exchange,
  onPress,
}: {
  exchange: ExternalExchangeProvider
  onPress: () => void
}) {
  return (
    <Touchable onPress={onPress} testID={`${exchange.name}-Touchable`}>
      <Text style={styles.exchangeText}>{exchange.name}</Text>
    </Touchable>
  )
}

function ExchangesBottomSheet({ forwardedRef, onClose, onExchangeSelected, exchanges }: Props) {
  const { t } = useTranslation()

  const getOnExchangePress = (exchange: ExternalExchangeProvider) => () => {
    navigate(Screens.WebViewScreen, { uri: exchange.link })
    onExchangeSelected(exchange)
  }

  return (
    <BottomSheet
      forwardedRef={forwardedRef}
      title={t('fiatExchangeFlow.exchange.bottomSheetTitle')}
      description={t('fiatExchangeFlow.exchange.bottomSheetInfo')}
      onClose={onClose}
    >
      {exchanges.map((exchange, index) => {
        return (
          <React.Fragment key={`exchange-${exchange.name}`}>
            {index > 0 && <View style={styles.separator} />}
            <ExchangeOption exchange={exchange} onPress={getOnExchangePress(exchange)} />
          </React.Fragment>
        )
      })}
    </BottomSheet>
  )
}

ExchangesBottomSheet.navigationOptions = {}

const styles = StyleSheet.create({
  exchangeText: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: colors.borderPrimary,
  },
})

export default ExchangesBottomSheet
