import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { showMessage } from 'src/alert/actions'
import { AssetsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes } from 'src/components/Button'
import InLineNotification, { Severity } from 'src/components/InLineNotification'
import TextInput from 'src/components/TextInput'
import CustomHeader from 'src/components/header/CustomHeader'
import GreenLoadingSpinner from 'src/icons/GreenLoadingSpinner'
import { noHeader } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { PasteButton } from 'src/tokens/PasteButton'

type Props = NativeStackScreenProps<StackParamList, Screens.TokenImport>

export default function TokenImportScreen(_: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const [tokenAddress, setTokenAddress] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')

  const navigateBackAndToast = () => {
    ValoraAnalytics.track(AssetsEvents.import_token_submit)
    navigateBack()
    // TODO RET-891: do this only when actually imported
    dispatch(showMessage(t('tokenImport.importSuccess', { tokenSymbol })))
  }

  const isValidAddress = useMemo(() => {
    // TODO RET-892: later will be changed to validate via viem
    return tokenAddress.length == 42 // 0x prefix and 20 bytes address
  }, [tokenAddress])

  const errorMessage = () => {
    // TODO RET-892: when states and validation are added, choose appropriate error or return null
    const errors = [
      t('tokenImport.error.invalidToken'),
      t('tokenImport.error.alreadySupported'),
      t('tokenImport.error.alreadyImported'),
    ]
    return <Text style={styles.errorLabel}>{errors[0]}</Text>
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader
        style={styles.customHeader}
        left={<BackButton />}
        title={<Text style={styles.headerTitle}>{t('tokenImport.title')}</Text>}
      />
      <ScrollView>
        <View style={styles.titleContainer}>
          <InLineNotification
            severity={Severity.Informational}
            description={t('tokenImport.notification')}
          />

          <View style={{ gap: Spacing.Thick24, width: '100%' }}>
            {/* Token Address */}
            <View style={styles.textInputGroup}>
              <Text style={styles.label}>{t('tokenImport.input.tokenAddress')}</Text>
              <TextInput
                onChangeText={setTokenAddress}
                value={tokenAddress}
                multiline={false}
                style={styles.messageTextInput}
                placeholderTextColor={Colors.gray4}
                underlineColorAndroid="transparent"
                numberOfLines={1}
                placeholder={t('tokenImport.input.tokenAddressPlaceholder') ?? undefined}
                showClearButton={true}
                rightElement={
                  !tokenAddress && (
                    <PasteButton
                      onPress={(address) => {
                        setTokenAddress(address)
                        ValoraAnalytics.track(AssetsEvents.import_token_paste)
                      }}
                    />
                  )
                }
                maxLength={42} // 0x prefix and 20 bytes
              />
            </View>

            {/* Token Symbol */}
            <View style={styles.textInputGroup}>
              <Text style={styles.label}>{t('tokenImport.input.tokenSymbol')}</Text>
              <TextInput
                onChangeText={setTokenSymbol}
                value={tokenSymbol}
                multiline={false}
                style={styles.messageTextInput}
                placeholderTextColor={Colors.gray4}
                underlineColorAndroid="transparent"
                numberOfLines={1}
                showClearButton={true}
                editable={isValidAddress}
                rightElement={isValidAddress && <GreenLoadingSpinner height={32} />} // TODO RET-892: once loaded, hide the spinner
              />
              {errorMessage()}
            </View>

            {/* Network */}
            <View style={styles.textInputGroup}>
              <Text style={styles.label}>{t('tokenImport.input.network')}</Text>
              <TextInput
                onChangeText={setTokenSymbol}
                value={t('celoGold') ?? undefined}
                multiline={false}
                style={styles.messageTextInput}
                placeholderTextColor={Colors.gray4}
                underlineColorAndroid="transparent"
                numberOfLines={1}
                showClearButton={true}
                editable={false}
              />
            </View>
          </View>
        </View>
      </ScrollView>
      <Button
        size={BtnSizes.FULL}
        text={t('tokenImport.importButton')}
        showLoading={false}
        disabled={tokenSymbol.length == 0} // TODO RET-892: enable button if the contract was loaded
        onPress={navigateBackAndToast}
        style={styles.buttonContainer}
      />
    </SafeAreaView>
  )
}

TokenImportScreen.navigationOptions = {
  ...noHeader,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customHeader: {
    paddingHorizontal: variables.contentPadding,
  },
  headerTitle: {
    ...typeScale.bodyMedium,
  },
  messageTextInput: {
    width: '100%',
    ...typeScale.bodySmall,
    paddingHorizontal: Spacing.Small12,
    borderColor: Colors.gray2,
    borderRadius: Spacing.Tiny4,
    borderWidth: 1.5,
    color: Colors.dark,
  },
  titleContainer: {
    alignItems: 'center',
    marginVertical: Spacing.Smallest8,
    marginHorizontal: Spacing.Thick24,
    gap: Spacing.Regular16,
    ...typeScale.titleLarge,
  },
  buttonContainer: {
    paddingVertical: Spacing.Regular16,
    paddingHorizontal: Spacing.Thick24,
    borderTopColor: Colors.gray2,
  },
  textInputGroup: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: Spacing.Smallest8,
  },
  label: {
    ...typeScale.labelSmall,
    flexWrap: 'wrap',
  },
  errorLabel: {
    ...typeScale.labelSmall,
    color: Colors.warning,
  },
})
