import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { ReactElement, useEffect, useState } from 'react'
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
import Dropdown from 'src/components/Dropdown'
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
import { networksIconSelector, tokensByIdSelector } from 'src/tokens/selectors'
import { importToken } from 'src/tokens/slice'
import { getSupportedNetworkIdsForTokenBalances, getTokenId } from 'src/tokens/utils'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import { networkIdToNetwork } from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { Address, BaseError, TimeoutError, formatUnits, getContract, isAddress } from 'viem'

const TAG = 'tokens/TokenImport'

type Props = NativeStackScreenProps<StackParamList, Screens.TokenImport>

interface TokenDetails {
  address: string
  symbol: string
  decimals: number
  name: string
  balance: string
  networkId: NetworkId
}

enum Errors {
  AlreadyImported = 'AlreadyImported',
  AlreadySupported = 'AlreadySupported',
  Timeout = 'Timeout',
  NotERC20 = 'NotERC20',
}

export default function TokenImportScreen(_: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  // Should I create a new config for this?
  const supportedNetworkIds = getSupportedNetworkIdsForTokenBalances()
  const networkShouldBeEditable = supportedNetworkIds.length > 1

  const [tokenAddress, setTokenAddress] = useState<string | undefined>()
  const [tokenDetails, setTokenDetails] = useState<TokenDetails>()
  const [error, setError] = useState<string | null>(null)

  const [networkId, setNetworkId] = useState<NetworkId | null>(
    networkShouldBeEditable ? null : supportedNetworkIds[0]
  )
  const walletAddress = useSelector(walletAddressSelector)
  const supportedTokens = useSelector((state) => tokensByIdSelector(state, supportedNetworkIds))

  const networkIconByNetworkId = useSelector((state) =>
    networksIconSelector(state, supportedNetworkIds)
  )

  const validateAddress = (tokenAddress: string): tokenAddress is Address => {
    if (!tokenAddress || !networkId) return false

    if (!isAddress(tokenAddress)) {
      setError(t('tokenImport.error.invalidAddress'))
      return false
    }

    const tokenId = getTokenId(networkId, tokenAddress.toLowerCase())
    if (supportedTokens[tokenId]) {
      setError(t('tokenImport.error.tokenAlreadySupported'))
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

  const fetchTokenDetails = async (
    walletAddress: Address,
    tokenAddress: Address,
    networkId: NetworkId
  ): Promise<TokenDetails> => {
    const contract = getContract({
      abi: erc20.abi,
      address: tokenAddress,
      client: {
        public: publicClient[networkIdToNetwork[networkId]],
      },
    })

    const [symbol, decimals, name, balance] = await Promise.all([
      contract.read.symbol(),
      contract.read.decimals(),
      contract.read.name(),
      contract.read.balanceOf([walletAddress]),
    ])

    const balanceInDecimal = formatUnits(balance, decimals)

    Logger.info(
      TAG,
      `Wallet ${walletAddress} holds ${balanceInDecimal} ${symbol} (${name} = ${tokenAddress})})`
    )

    return { address: tokenAddress, symbol, decimals, name, balance: balanceInDecimal, networkId }
  }

  const validateContract = useAsyncCallback(fetchTokenDetails, {
    onSuccess: (details) => {
      setTokenDetails(details)
    },
    onError: (error) => {
      Logger.error(TAG, `Could not fetch token details`, error)
      setError(t('tokenImport.error.invalidToken'))

      // it doesn't directly show if it's a timeout error, need to check cause recursively
      const hasTimeout = (error: unknown): boolean =>
        error instanceof BaseError &&
        (error instanceof TimeoutError || (error.cause !== undefined && hasTimeout(error.cause)))

      // This shouldn't happen
      if (!tokenAddress || !networkId) {
        Logger.error(TAG, 'Token address or network id is not set')
        return
      }

      const trackedError = hasTimeout(error) ? Errors.Timeout : Errors.NotERC20
      const tokenId = getTokenId(networkId, tokenAddress.toLowerCase())
      ValoraAnalytics.track(AssetsEvents.import_token_error, {
        networkId,
        tokenId,
        tokenAddress,
        error: trackedError,
      })
    },
  })

  const isLoadingTokenDetails = validateContract.status === 'loading'

  const ensure0xPrefixOrEmpty = (address: string): string =>
    !address || address.startsWith('0x') ? address : `0x${address}`

  const handleAddressBlur = async () => {
    if (!tokenAddress) return
    const addressWith0xPrefix = ensure0xPrefixOrEmpty(tokenAddress)
    setTokenAddress(addressWith0xPrefix)
  }

  const handlePaste = async (address: string) => {
    ValoraAnalytics.track(AssetsEvents.import_token_paste)
    const addressWith0xPrefix = ensure0xPrefixOrEmpty(address)
    setTokenAddress(addressWith0xPrefix)
    Keyboard.dismiss()
  }

  useEffect(() => {
    if (
      walletAddress &&
      tokenAddress &&
      networkId &&
      isAddress(walletAddress) &&
      validateAddress(tokenAddress)
    ) {
      validateContract.execute(walletAddress, tokenAddress, networkId).catch(() => undefined)
    }
  }, [walletAddress, tokenAddress, networkId])

  const handleImportToken = () => {
    if (!tokenDetails) {
      Logger.warn(TAG, 'Token details not found, cannot import token')
      return
    }

    const networkId = tokenDetails.networkId
    const tokenAddress = tokenDetails.address.toLowerCase()

    // This should always be present, unless we support a network without tokens,
    // or if we can't fetch the token list (e.g. network issues?), should we fail instead to be safe?
    const networkIconUrl = networkIconByNetworkId[networkId]

    const tokenId = getTokenId(networkId, tokenAddress)
    ValoraAnalytics.track(AssetsEvents.import_token_submit, {
      tokenAddress,
      tokenSymbol: tokenDetails.symbol,
      networkId,
      tokenId,
    })

    Logger.info(TAG, `Importing token: ${tokenId})})`)
    dispatch(importToken({ ...tokenDetails, tokenId, networkIconUrl }))

    navigateBack()
    dispatch(showMessage(t('tokenImport.importSuccess', { tokenSymbol: tokenDetails.symbol })))
  }

  const clearFetchedState = () => {
    setError(null)
    setTokenDetails(undefined)
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
          {/* Network */}
          <View style={{ ...styles.textInputGroup, zIndex: 1 }}>
            {networkShouldBeEditable ? (
              <>
                <Text style={styles.label}>{t('tokenImport.input.network')}</Text>
                <Dropdown
                  options={supportedNetworkIds.map((networkId) => ({
                    value: networkId,
                    label: NETWORK_NAMES[networkId],
                  }))}
                  onValueSelected={(networkId) => {
                    clearFetchedState()
                    setNetworkId(networkId)
                  }}
                  testId="NetworkDropdown"
                />
              </>
            ) : (
              <TextInputGroup
                label={t('tokenImport.input.network')}
                value={NETWORK_NAMES[supportedNetworkIds[0]]}
                onChangeText={() => undefined}
                editable={false}
              />
            )}
          </View>

          {/* Token Address */}
          <TextInputGroup
            label={t('tokenImport.input.tokenAddress')}
            value={tokenAddress}
            onChangeText={(address) => {
              clearFetchedState()
              setTokenAddress(address)
            }}
            editable={!isLoadingTokenDetails}
            placeholder={t('tokenImport.input.tokenAddressPlaceholder') ?? undefined}
            rightElement={!tokenAddress && <PasteButton onPress={handlePaste} />}
            onBlur={handleAddressBlur}
            returnKeyType={'search'}
            maxLength={42} // 0x prefix and 20 bytes
          />

          {/* Token Symbol */}
          <TextInputGroup
            label={t('tokenImport.input.tokenSymbol')}
            value={tokenDetails?.symbol ?? ''}
            onChangeText={() => undefined}
            editable={false}
            rightElement={
              (validateContract.status === 'loading' && <GreenLoadingSpinner height={32} />) ||
              (validateContract.status === 'success' && <Checkmark />)
            }
            errorElement={error ? <Text style={styles.errorLabel}>{error}</Text> : <></>}
            testID={'tokenSymbol'}
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
    ...typeScale.labelSemiBoldMedium,
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
