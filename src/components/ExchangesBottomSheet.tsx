import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import BottomSheetLegacy from 'src/components/BottomSheetLegacy'
import Touchable from 'src/components/Touchable'
import { ExternalExchangeProvider } from 'src/exchange/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  isVisible: boolean
  onClose: () => void
  onExchangeSelected: (exchange: ExternalExchangeProvider) => void
  exchanges: ExternalExchangeProvider[]
}

function ExchangeOption({
  exchange,
  onPress,
  index,
}: {
  exchange: ExternalExchangeProvider
  onPress: () => void
  index: number
}) {
  return (
    <Touchable onPress={onPress} testID={`${exchange.name}-Touchable`}>
      <Text testID={`exchange-${index}`} style={styles.exchangeText}>
        {exchange.name}
      </Text>
    </Touchable>
  )
}

function ExchangesBottomSheet({ isVisible, onClose, onExchangeSelected, exchanges }: Props) {
  const { t } = useTranslation()

  const getOnExchangePress = (exchange: ExternalExchangeProvider) => () => {
    navigate(Screens.WebViewScreen, { uri: exchange.link })
    onExchangeSelected(exchange)
  }

  return (
    <BottomSheetLegacy isVisible={isVisible} onBackgroundPress={onClose}>
      <>
        <Text style={styles.title}>{t('fiatExchangeFlow.exchange.bottomSheetTitle')}</Text>
        <Text style={styles.info}>{t('fiatExchangeFlow.exchange.bottomSheetInfo')}</Text>
        {exchanges.map((exchange, index) => {
          return (
            <React.Fragment key={`exchange-${exchange.name}`}>
              {index > 0 && <View style={styles.separator} />}
              <ExchangeOption
                index={index}
                exchange={exchange}
                onPress={getOnExchangePress(exchange)}
              />
            </React.Fragment>
          )
        })}
      </>
    </BottomSheetLegacy>
  )
}

ExchangesBottomSheet.navigationOptions = {}

const styles = StyleSheet.create({
  title: {
    ...fontStyles.h2,
    marginBottom: Spacing.Smallest8,
  },
  info: {
    color: colors.gray4,
    marginBottom: Spacing.Smallest8,
  },
  exchangeText: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: colors.gray2,
  },
})

export default ExchangesBottomSheet
