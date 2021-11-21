import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { noHeader } from 'src/navigator/Headers'
import { navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

type Props = StackScreenProps<StackParamList, Screens.WalletConnectResult>

function Result({ route }: Props) {
  const { t } = useTranslation()
  const { title, subtitle } = route.params

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Button onPress={navigateHome} text={t('goBackButton')} type={BtnTypes.SECONDARY} />
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
