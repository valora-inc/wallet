import QRCodeBorderlessIcon from '@celo/react-components/icons/QRCodeBorderless'
import RewardIcon from '@celo/react-components/icons/RewardIcon'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
// import styles from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

function AddFundOnboardingContainer() {
  const { t } = useTranslation()

  const onPressAddFund = () => {
    navigate(Screens.FiatExchangeOptions, {
      isCashIn: true,
    })
  }

  const onPressCopyAddress = () => {
    navigate(Screens.QRNavigator)
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPressAddFund}>
        <View style={styles.addFundButton}>
          <RewardIcon />
          <Text style={styles.addFundButtonTitle}>Fund your Valora wallet</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={onPressCopyAddress}>
        <View style={styles.copyAddressButton}>
          <QRCodeBorderlessIcon height={36} color={colors.greenUI} />
          <Text style={styles.copyAddressButtonTitle}>Transfer from exchange</Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 180,
    paddingTop: 12,
    margin: variables.contentPadding,
    alignItems: 'center',
  },
  title: {
    ...fontStyles.regular500,
  },
  details: {
    ...fontStyles.small,
    paddingTop: 12,
    color: colors.gray4,
  },
  addFundButton: {
    paddingVertical: 24,
    borderRadius: 25,
    height: 60,
    width: 328,
    backgroundColor: 'rgba(26, 183, 117, 0.15)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFundButtonTitle: {
    ...fontStyles.iconText,
    color: colors.greenUI,
    marginLeft: 12,
  },
  addFundButtonBody: {
    ...fontStyles.small,
  },
  copyAddressButton: {
    marginTop: 24,
    height: 60,
    width: 328,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 183, 117, 0.15)',
  },
  copyAddressButtonTitle: {
    ...fontStyles.iconText,
    color: colors.greenUI,
    marginLeft: 12,
  },
  copyAddressButtonBody: {
    ...fontStyles.small,
  },
})

export default AddFundOnboardingContainer
