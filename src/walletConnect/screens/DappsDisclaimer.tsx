import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  isDappListed: boolean
}

const DappsDisclaimer = ({ isDappListed }: Props) => {
  const { t } = useTranslation()

  return (
    <Text style={styles.dappNotListedDisclaimer}>
      {isDappListed ? t('dappsDisclaimerSingleDapp') : t('dappsDisclaimerUnlistedDapp')}
    </Text>
  )
}

const styles = StyleSheet.create({
  dappNotListedDisclaimer: {
    ...typeScale.bodyXSmall,
    color: Colors.gray4,
    marginBottom: Spacing.Thick24,
    textAlign: 'center',
  },
})

export default DappsDisclaimer
