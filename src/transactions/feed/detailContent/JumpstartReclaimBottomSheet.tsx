import { BottomSheetScreenProps } from '@th3rdwave/react-navigation-bottom-sheet'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { Colors } from 'react-native/Libraries/NewAppScreen'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import Button, { BtnSizes } from 'src/components/Button'
import DataFieldWithCopy from 'src/components/DataFieldWithCopy'
import Logo from 'src/icons/Logo'
import { navigateBack, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'
import EstimatedNetworkFee from 'src/walletConnect/screens/EstimatedNetworkFee'

type Props = BottomSheetScreenProps<StackParamList, Screens.JumpstartReclaimBottomSheet>

const TAG = 'JumpstartReclaimBottomSheet'

function JumpstartReclaimBottomSheet({
  route: {
    params: { reclaimTx, networkId, tokenAmount },
  },
}: Props) {
  const { t } = useTranslation()

  const transactionString = JSON.stringify(reclaimTx)

  async function onConfirm() {
    Logger.debug(TAG, 'Reclaiming', { reclaimTx, networkId, tokenAmount })
    // TODO: Send transaction
    navigateBack()
    navigateHome()
  }

  return (
    <BottomSheetScrollView isScreen>
      <Logo height={24} />
      <Text style={styles.header}>{t('confirmTransaction')}</Text>
      <Text style={styles.description}>{t('jumpstartReclaimDescription')}</Text>
      <DataFieldWithCopy
        label={t('walletConnectRequest.transactionDataLabel')}
        value={transactionString}
        copySuccessMessage={t('walletConnectRequest.transactionDataCopied')}
        testID="JumpstarReclaimBottomSheet/RequestPayload"
      />
      <EstimatedNetworkFee networkId={networkId} transaction={reclaimTx} />
      <Button text={t('confirm')} onPress={onConfirm} size={BtnSizes.FULL} />
    </BottomSheetScrollView>
  )
}

const styles = StyleSheet.create({
  header: {
    ...typeScale.titleSmall,
    color: Colors.black,
    paddingVertical: Spacing.Regular16,
  },
  description: {
    ...typeScale.bodySmall,
    color: Colors.black,
    marginBottom: Spacing.Thick24,
  },
})

export default JumpstartReclaimBottomSheet
