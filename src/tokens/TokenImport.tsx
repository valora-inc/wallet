import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { ReactElement, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import erc20 from 'src/abis/IERC20'
import { showMessage } from 'src/alert/actions'
import { AssetsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes } from 'src/components/Button'
import InLineNotification, { Severity } from 'src/components/InLineNotification'
import TextInput, { TextInputProps } from 'src/components/TextInput'
import CustomHeader from 'src/components/header/CustomHeader'
import GreenLoadingSpinner from 'src/icons/GreenLoadingSpinner'
import { noHeader } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import { NETWORK_NAMES } from 'src/shared/conts'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { PasteButton } from 'src/tokens/PasteButton'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { getTokenId } from 'src/tokens/utils'
import { publicClient } from 'src/viem'
import networkConfig, { networkIdToNetwork } from 'src/web3/networkConfig'
import { Address, getContract, isAddress, isHex } from 'viem'

type Props = NativeStackScreenProps<StackParamList, Screens.TokenImport>

enum AddressState {
  Incomplete,
  Invalid,
  AlreadySupported,
  AlreadyImported,
  FetchingContract,
  LikelyERC20,
  NotERC20,
  NetworkIssue,
}

export default function TokenImportScreen(_: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const [addressState, setAddressState] = useState(AddressState.Incomplete)
  const [tokenAddress, setTokenAddress] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [networkId] = useState(networkConfig.defaultNetworkId)
  const supportedTokens = useSelector((state) => tokensByIdSelector(state, [networkId]))

  const ensureHexOrEmpty = (address: string) =>
    isHex(address) || !address ? address : `0x${address}`

  const handleAddressFocus = () => {
    setAddressState(AddressState.Incomplete)
  }

  const validateAddress = (address: string) => {
    if (isAddress(address)) {
      const tokenId = getTokenId(networkId, address.toLowerCase())
      // TODO(RET-891): if already imported, set state as AddressState.AlreadyImported
      if (supportedTokens[tokenId]) {
        setAddressState(AddressState.AlreadySupported)
      } else {
        validateCheck(address)
      }
    } else {
      setAddressState(AddressState.Invalid)
    }
  }

  const validateCheck = async (address: Address) => {
    setAddressState(AddressState.FetchingContract)

    const contract = getContract({
      abi: erc20.abi,
      address,
      publicClient: publicClient[networkIdToNetwork[networkId]],
    })

    const state = await Promise.race<AddressState>([
      new Promise((resolve) => {
        Promise.all([
          contract.read.symbol(),
          contract.read.decimals(),
          contract.read.name(),
          contract.read.totalSupply(),
        ])
          .then(([symbol, decimals, name, totalSupply]) => {
            setTokenSymbol(symbol)
            resolve(AddressState.LikelyERC20)
          })
          .catch(() => resolve(AddressState.NotERC20))
      }),
      new Promise((resolve) => setTimeout(() => resolve(AddressState.NetworkIssue), 5000)),
    ])
    setAddressState(state)
  }

  const handleEnteredAddress = (address: string) => {
    address = ensureHexOrEmpty(address)
    setTokenAddress(address)
    validateAddress(address)
  }

  const handleAddressBlur = () => handleEnteredAddress(tokenAddress)

  const handlePaste = (address: string) => {
    handleEnteredAddress(address)
    ValoraAnalytics.track(AssetsEvents.import_token_paste)
  }

  const handleImportToken = () => {
    const tokenId = getTokenId(networkId, tokenAddress.toLowerCase())
    ValoraAnalytics.track(AssetsEvents.import_token_submit, {
      tokenAddress,
      tokenSymbol,
      networkId,
      tokenId,
    })
    // TODO RET-891: navigate back and show success only when actually imported
    navigateBack()
    dispatch(showMessage(t('tokenImport.importSuccess', { tokenSymbol })))
  }

  const renderErrorMessage = (): ReactElement<Text> => {
    const errors: { [key in AddressState]?: string | null } = {
      [AddressState.AlreadySupported]: t('tokenImport.error.alreadySupported'),
      [AddressState.AlreadyImported]: t('tokenImport.error.alreadyImported'),
      [AddressState.Invalid]: t('tokenImport.error.invalidToken'),
      [AddressState.NotERC20]: t('tokenImport.error.notErc20Token'),
      [AddressState.NetworkIssue]: t('tokenImport.error.timeout'),
    }

    const error = errors[addressState]
    return error ? <Text style={styles.errorLabel}>{error}</Text> : <></>
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader
        style={styles.customHeader}
        left={<BackButton />}
        title={<Text style={styles.headerTitle}>{t('tokenImport.title')}</Text>}
      />
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <InLineNotification
          severity={Severity.Informational}
          description={t('tokenImport.notification')}
        />

        <View style={styles.inputContainer}>
          {/* Token Address */}
          <TextInputGroup
            label={t('tokenImport.input.tokenAddress')}
            value={tokenAddress}
            onChangeText={setTokenAddress}
            placeholder={t('tokenImport.input.tokenAddressPlaceholder') ?? undefined}
            rightElement={!tokenAddress && <PasteButton onPress={handlePaste} />}
            onFocus={handleAddressFocus}
            onBlur={handleAddressBlur}
            returnKeyType={'search'}
            maxLength={42} // 0x prefix and 20 bytes
          />

          {/* Token Symbol */}
          <TextInputGroup
            label={t('tokenImport.input.tokenSymbol')}
            value={tokenSymbol}
            onChangeText={setTokenSymbol}
            editable={addressState === AddressState.LikelyERC20}
            rightElement={
              addressState === AddressState.FetchingContract && <GreenLoadingSpinner height={32} />
            }
            errorElement={renderErrorMessage()}
            testID={'tokenSymbol'}
          />

          {/* Network */}
          <TextInputGroup
            label={t('tokenImport.input.network')}
            value={NETWORK_NAMES[networkId]}
            onChangeText={() => undefined}
            editable={false}
          />
        </View>
      </ScrollView>
      <Button
        size={BtnSizes.FULL}
        text={t('tokenImport.importButton')}
        showLoading={false}
        disabled={addressState !== AddressState.LikelyERC20 || tokenSymbol.length == 0}
        onPress={handleImportToken}
        style={styles.buttonContainer}
      />
    </SafeAreaView>
  )
}

const TextInputGroup = ({
  label,
  errorElement,
  ...textInputProps
}: { label: string; errorElement?: ReactElement<Text> } & TextInputProps) => (
  <View style={styles.textInputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      multiline={false}
      style={styles.messageTextInput}
      placeholderTextColor={Colors.gray4}
      numberOfLines={1}
      showClearButton={true}
      {...textInputProps}
    />
    {errorElement}
  </View>
)

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
    paddingHorizontal: Spacing.Small12,
    borderColor: Colors.gray2,
    borderRadius: Spacing.Tiny4,
    borderWidth: 1.5,
  },
  scrollViewContainer: {
    marginVertical: Spacing.Smallest8,
    marginHorizontal: Spacing.Thick24,
    gap: Spacing.Regular16,
  },
  buttonContainer: {
    paddingVertical: Spacing.Regular16,
    paddingHorizontal: Spacing.Thick24,
  },
  inputContainer: {
    gap: Spacing.Thick24,
  },
  textInputGroup: {
    gap: Spacing.Smallest8,
  },
  label: {
    ...typeScale.labelSmall,
  },
  errorLabel: {
    ...typeScale.labelSmall,
    color: Colors.error,
  },
})
