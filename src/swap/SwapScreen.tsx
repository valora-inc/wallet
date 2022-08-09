import React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import i18n, { withTranslation } from 'src/i18n'
import { HeaderTitleWithSubtitle, headerWithBackButton } from 'src/navigator/Headers'
import variables from 'src/styles/variables'
import ExchangeModal from 'src/swap/ExchangeModal'

type Props = WithTranslation

function SwapScreen({ t }: Props) {
  return (
    <View style={styles.container} testID={'Swap/Main'}>
      <ExchangeModal type={'Swap'} />
    </View>
  )
}

SwapScreen.navigationOptions = () => {
  return {
    ...headerWithBackButton,
    headerTitle: () => <HeaderTitleWithSubtitle title={i18n.t('swap.title')} />,
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: variables.contentPadding,
    marginVertical: 16,
  },
})

export default withTranslation<Props>()(SwapScreen)
