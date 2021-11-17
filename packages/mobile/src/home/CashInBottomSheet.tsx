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
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

function CashInBottomSheet() {
  const { t } = useTranslation()
  const [isModalVisible, setModalVisible] = useState(true)

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
