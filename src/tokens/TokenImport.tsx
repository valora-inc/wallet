import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { ReactElement, useState } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import erc20 from 'src/abis/IERC20'
import { showMessage } from 'src/alert/actions'
import { AssetsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes } from 'src/components/Button'
import InLineNotification, { Severity } from 'src/components/InLineNotification'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
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
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import networkConfig, { networkIdToNetwork } from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { Address, formatUnits, getContract, isAddress } from 'viem'

const TAG = 'tokens/TokenImport'

type Props = NativeStackScreenProps<StackParamList, Screens.TokenImport>

const FETCH_TOKEN_DETAILS_TIMEOUT_MS = 5_000

interface TokenDetails {
  symbol: string
  decimals: number
  name: string
  balance: bigint
}

export default function TokenImportScreen(_: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const [tokenAddress, setTokenAddress] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [networkId] = useState(networkConfig.defaultNetworkId)

  const walletAddress = useSelector(walletAddressSelector)
  const supportedTokens = useSelector((state) => tokensByIdSelector(state, [networkId]))

  const validateAddress = (address: string): address is Address => {
    if (!address) return false

    if (!isAddress(address)) {
      setError(t('tokenImport.error.invalidToken'))
      return false
    }

    // TODO(RET-891): if already imported, set state as AddressState.AlreadyImported
    const tokenId = getTokenId(networkId, address.toLowerCase())
    if (supportedTokens[tokenId]) {
      setError(t('tokenImport.error.alreadySupported'))
      return false
    }

    setError(null)
    return true
  }

  const fetchTokenDetails = async (
    tokenAddress: Address,
    walletAddress: Address
  ): Promise<TokenDetails> => {
    const contract = getContract({
      abi: erc20.abi,
      address: tokenAddress,
      publicClient: publicClient[networkIdToNetwork[networkId]],
    })

    const [symbol, decimals, name, balance] = await Promise.all([
      contract.read.symbol(),
      contract.read.decimals(),
      contract.read.name(),
      contract.read.balanceOf([walletAddress]),
    ])

    return { symbol, decimals, name, balance }
  }

  const validateContract = useAsyncCallback(
    async (address: Address): Promise<TokenDetails> => {
      if (!walletAddress || !isAddress(walletAddress)) {
        // should never happen
        throw new Error('No wallet address found when fetching token details')
      }

      const details = fetchTokenDetails(address, walletAddress)
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(reject, FETCH_TOKEN_DETAILS_TIMEOUT_MS, new Error('Timeout'))
      )

      return Promise.race([timeout, details])
    },
    {
      onSuccess: (details) => {
        Logger.info(
          TAG,
          `Balance for ${details.name}: ${formatUnits(details.balance, details.decimals)} ${
            details.symbol
          }`
        )
        setTokenSymbol(details.symbol)
      },
      onError: (error) => {
        Logger.error(TAG, 'Could not fetch token details', error)
        if (error.message === 'Timeout') {
          setError(t('tokenImport.error.timeout'))
        } else {
          setError(t('tokenImport.error.notErc20Token'))
        }
      },
    }
  )

  const ensure0xPrefixOrEmpty = (address: string) =>
    !address || address.startsWith('0x') ? address : `0x${address}`

  const handleAddressBlur = async () => {
    if (validateContract.status !== 'not-requested') {
      return
    }
    const address = ensure0xPrefixOrEmpty(tokenAddress)
    setTokenAddress(address)
    if (validateAddress(address)) {
      await validateContract.execute(address).catch(() => undefined)
    }
  }

  const handlePaste = async (address: string) => {
    const addressWith0xPrefix = ensure0xPrefixOrEmpty(address)
    setTokenAddress(addressWith0xPrefix)
    if (validateAddress(addressWith0xPrefix)) {
      await validateContract.execute(addressWith0xPrefix).catch(() => undefined)
    }
    Keyboard.dismiss()
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

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader
        style={styles.customHeader}
        left={<BackButton />}
        title={<Text style={styles.headerTitle}>{t('tokenImport.title')}</Text>}
      />
      <KeyboardAwareScrollView contentContainerStyle={styles.scrollViewContainer}>
        <InLineNotification
          severity={Severity.Informational}
          description={t('tokenImport.notification')}
        />

        <View style={styles.inputContainer}>
          {/* Token Address */}
          <TextInputGroup
            label={t('tokenImport.input.tokenAddress')}
            value={tokenAddress}
            onChangeText={(address) => {
              setTokenAddress(address)
              setError(null)
              setTokenSymbol('')
              validateContract.reset()
            }}
            placeholder={t('tokenImport.input.tokenAddressPlaceholder') ?? undefined}
            rightElement={!tokenAddress && <PasteButton onPress={handlePaste} />}
            onBlur={handleAddressBlur}
            returnKeyType={'search'}
            maxLength={42} // 0x prefix and 20 bytes
          />

          {/* Token Symbol */}
          <TextInputGroup
            label={t('tokenImport.input.tokenSymbol')}
            value={tokenSymbol}
            onChangeText={setTokenSymbol}
            editable={false}
            rightElement={
              validateContract.status === 'loading' && <GreenLoadingSpinner height={32} />
            }
            errorElement={error ? <Text style={styles.errorLabel}>{error}</Text> : <></>}
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
      </KeyboardAwareScrollView>
      <Button
        size={BtnSizes.FULL}
        text={t('tokenImport.importButton')}
        showLoading={false}
        disabled={validateContract.status !== 'success'}
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
      autoCorrect={false}
      spellCheck={false}
      autoCapitalize={'none'}
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
