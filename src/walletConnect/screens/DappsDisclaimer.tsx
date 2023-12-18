import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { useSelector } from 'react-redux'
import { dappConnectInfoSelector, dappsMinimalDisclaimerEnabledSelector } from 'src/dapps/selectors'
import { DappConnectInfo } from 'src/dapps/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  isDappListed: boolean
}

const DappsDisclaimer = ({ isDappListed }: Props) => {
  const { t } = useTranslation()
  const dappsMinimalDisclaimerEnabled = useSelector(dappsMinimalDisclaimerEnabledSelector)
  const dappConnectInfo = useSelector(dappConnectInfoSelector)

  if (dappsMinimalDisclaimerEnabled) {
    return (
      <Text style={styles.dappNotListedDisclaimer}>
        {isDappListed ? t('dappsDisclaimerSingleDapp') : t('dappsDisclaimerUnlistedDapp')}
      </Text>
    )
  }

  if (!isDappListed && dappConnectInfo === DappConnectInfo.Basic) {
    return <Text style={styles.dappNotListedDisclaimer}>{t('dappNotListed')}</Text>
  }

  return null
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
