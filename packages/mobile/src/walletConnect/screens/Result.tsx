import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Button, { BtnTypes } from 'src/components/Button'
import { noHeader } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'

type Props = StackScreenProps<StackParamList, Screens.WalletConnectResult>

function Result({ route }: Props) {
  const { t } = useTranslation()
  const { title, subtitle } = route.params

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Button onPress={navigateBack} text={t('goBackButton')} type={BtnTypes.SECONDARY} />
    </View>
  )
}

Result.navigationOptions = noHeader

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: variables.contentPadding,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...fontStyles.h1,
    textAlign: 'center',
  },
  subtitle: {
    ...fontStyles.regular,
    color: colors.gray4,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
})

export default Result
