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
import Checkmark from 'src/icons/Checkmark'
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
import { Address, BaseError, TimeoutError, formatUnits, getContract, isAddress } from 'viem'

const TAG = 'tokens/TokenImport'

type Props = NativeStackScreenProps<StackParamList, Screens.TokenImport>

interface TokenDetails {
  address: string
  symbol: string
  decimals: number
  name: string
  balance: bigint
}

enum Errors {
  AlreadyImported = 'AlreadyImported',
  AlreadySupported = 'AlreadySupported',
  NotContract = 'NotContract',
  Timeout = 'Timeout',
  NotERC20 = 'NotERC20',
}
class NotContractError extends Error {
  name = 'NotContractError'
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

    // TODO(RET-891): if already imported, set error
    const tokenId = getTokenId(networkId, address.toLowerCase())
    if (supportedTokens[tokenId]) {
      setError(t('tokenImport.error.invalidToken'))
      ValoraAnalytics.track(AssetsEvents.import_token_error, {
        networkId,
        tokenId,
        tokenAddress,
        error: Errors.AlreadySupported,
      })
      return false
    }

    setError(null)
    return true
  }

  const fetchTokenDetails = async (): Promise<TokenDetails> => {
    if (!isAddress(tokenAddress)) {
      // shouldn't happen as this function is called only after validating the address
      throw new Error('Invalid token address')
    }
    if (!walletAddress || !isAddress(walletAddress)) {
      // should never happen
      throw new Error('No wallet address found when fetching token details')
    }

    const client = publicClient[networkIdToNetwork[networkId]]
    const contract = getContract({
      abi: erc20.abi,
      address: tokenAddress,
      publicClient: client,
    })

    const contractCode = await client.getBytecode({ address: tokenAddress })
    if (!contractCode) throw new NotContractError('Contract code is empty')

    const [symbol, decimals, name, balance] = await Promise.all([
      contract.read.symbol(),
      contract.read.decimals(),
      contract.read.name(),
      contract.read.balanceOf([walletAddress]),
    ])
    return { address: tokenAddress, symbol, decimals, name, balance }
  }

  const validateContract = useAsyncCallback(fetchTokenDetails, {
    onSuccess: (details) => {
      Logger.info(
        TAG,
        `Wallet ${walletAddress} holds ${formatUnits(details.balance, details.decimals)} ${
          details.symbol
        } (${details.name} = ${details.address})})`
      )
      setTokenSymbol(details.symbol)
    },
    onError: (error) => {
      Logger.error(TAG, `Could not fetch token details`, error)
      const tokenId = getTokenId(networkId, tokenAddress.toLowerCase())

      // it doesn't directly show if it's a timeout error, need to check cause recursively
      const hasTimeout = (error: unknown): boolean =>
        error instanceof BaseError &&
        (error instanceof TimeoutError || (error.cause !== undefined && hasTimeout(error.cause)))
      if (hasTimeout(error)) {
        setError(t('tokenImport.error.invalidToken'))
        ValoraAnalytics.track(AssetsEvents.import_token_error, {
          networkId,
          tokenId,
          tokenAddress,
          error: Errors.Timeout,
        })
        return
      }

      if (error instanceof NotContractError) {
        setError(t('tokenImport.error.invalidToken'))
        ValoraAnalytics.track(AssetsEvents.import_token_error, {
          networkId,
          tokenId,
          tokenAddress,
          error: Errors.NotContract,
        })
        return
      }

      setError(t('tokenImport.error.invalidToken'))
      ValoraAnalytics.track(AssetsEvents.import_token_error, {
        networkId,
        tokenId,
        tokenAddress,
        error: Errors.NotERC20,
      })
    },
  })

  const ensure0xPrefixOrEmpty = (address: string) =>
    !address || address.startsWith('0x') ? address : `0x${address}`

  const handleAddressBlur = async () => {
    if (error) return
    if (validateContract.status !== 'not-requested') return

    const address = ensure0xPrefixOrEmpty(tokenAddress)
    setTokenAddress(address)
    if (validateAddress(address)) {
      // ignore propagated error as it's already handled, see https://github.com/slorber/react-async-hook/issues/85
      await validateContract.execute().catch(() => undefined)
    }
  }

  const handlePaste = async (address: string) => {
    ValoraAnalytics.track(AssetsEvents.import_token_paste)
    const addressWith0xPrefix = ensure0xPrefixOrEmpty(address)
    setTokenAddress(addressWith0xPrefix)
    Keyboard.dismiss()
    if (validateAddress(addressWith0xPrefix)) {
      // ignore propagated error as it's already handled, see https://github.com/slorber/react-async-hook/issues/85
      await validateContract.execute().catch(() => undefined)
    }
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
            editable={validateContract.status !== 'loading'}
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
              (validateContract.status === 'loading' && <GreenLoadingSpinner height={32} />) ||
              (validateContract.status === 'success' && <Checkmark />)
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
