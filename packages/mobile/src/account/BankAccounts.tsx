import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  BackHandler,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { usePlaidEmitter } from 'react-native-plaid-link-sdk'
import { useDispatch, useSelector } from 'react-redux'
import { plaidParamsSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { CICOEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BorderlessButton from 'src/components/BorderlessButton'
import OptionsChooser from 'src/components/OptionsChooser'
import BackChevron from 'src/icons/BackChevron'
import PlusIcon from 'src/icons/PlusIcon'
import TripleDotVertical from 'src/icons/TripleDotVertical'
import {
  BankAccount,
  deleteFinclusiveBankAccount,
  getFinclusiveBankAccounts,
  verifyWalletAddress,
} from 'src/in-house-liquidity'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'
import openPlaid, { handleOnEvent } from './openPlaid'

type Props = StackScreenProps<StackParamList, Screens.BankAccounts>

const TAG = 'BankAccounts'
function BankAccounts({ navigation, route }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  usePlaidEmitter(handleOnEvent)
  const [isOptionsVisible, setIsOptionsVisible] = useState(false)
  const [selectedBankId, setSelectedBankId] = useState(0)
  const walletAddress = useSelector(walletAddressSelector)
  const plaidParams = useSelector(plaidParamsSelector)
  const { newPublicToken, fromSyncBankAccountScreen } = route.params

  const header = () => {
    return (
      <View style={styles.header}>
        <Text style={fontStyles.navigationHeader}>{t('bankAccountsScreen.header')}</Text>
      </View>
    )
  }

  const navigateToSettings = () => {
    navigate(Screens.Settings)
  }

  useEffect(() => {
    if (fromSyncBankAccountScreen === true) {
      // Prevent back button on Android when previous screen is SyncBankAccountScreen
      const backPressListener = () => true
      BackHandler.addEventListener('hardwareBackPress', backPressListener)
      return () => BackHandler.removeEventListener('hardwareBackPress', backPressListener)
    }
  }, [])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: header,
      headerLeft: () => (
        <TopBarIconButton
          icon={<BackChevron />}
          onPress={navigateToSettings}
          style={styles.backButton}
          testID="backButton"
        />
      ),
      // Prevent swiping back on iOS when previous screen is SyncBankAccountScreen
      gestureEnabled: !fromSyncBankAccountScreen,
    })
  }, [navigation])

  const bankAccounts = useAsync(async () => {
    try {
      const accounts = await getFinclusiveBankAccounts(verifyWalletAddress({ walletAddress }))
      return accounts
    } catch (error) {
      Logger.warn(TAG, error)
      dispatch(showError(ErrorMessages.GET_BANK_ACCOUNTS_FAIL))
      return
    }
  }, [newPublicToken])

  function getBankDisplay(bank: BankAccount) {
    // Todo: Consider adding a default placeholder image for banks without a logo available
    const bankLogoSrc = bank.institutionLogo ? `data:image/png;base64,${bank.institutionLogo}` : ''
    return (
      <View key={bank.id} style={styles.accountContainer} testID="accountContainer">
        <View style={styles.row}>
          <View style={styles.bankImgContainer}>
            <Image
              style={styles.bankImg}
              source={{ uri: bankLogoSrc }}
              testID={`BankLogoImg-${bank.id}`}
            />
          </View>
          <View style={styles.accountLabels}>
            <Text style={styles.bankName}>{`${
              bank.institutionName
            } (${bank.accountNumberTruncated.slice(-8)})`}</Text>
          </View>
        </View>
        <View style={styles.rightSide}>
          <BorderlessButton
            testID={`TripleDot${bank.id}`}
            onPress={() => {
              setIsOptionsVisible(true)
              setSelectedBankId(bank.id)
            }}
          >
            <View style={styles.tripleDots}>
              <TripleDotVertical />
            </View>
          </BorderlessButton>
        </View>
      </View>
    )
  }

  async function deleteBankAccount() {
    setIsOptionsVisible(false)
    ValoraAnalytics.track(CICOEvents.delete_bank_account, {
      id: selectedBankId,
    })
    try {
      await deleteFinclusiveBankAccount({
        ...verifyWalletAddress({ walletAddress }),
        id: selectedBankId,
      })
      await bankAccounts.execute()
    } catch (error) {
      Logger.warn(TAG, error)
      dispatch(showError(ErrorMessages.DELETE_BANK_ACCOUNT_FAIL))
    }
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      {bankAccounts?.loading && (
        <ActivityIndicator size="large" color={colors.gray2} testID="Loader" />
      )}
      {bankAccounts?.result?.map(getBankDisplay)}
      {!bankAccounts?.loading && (
        <View style={styles.addAccountContainer}>
          <BorderlessButton
            testID="AddAccount"
            onPress={async () => {
              ValoraAnalytics.track(CICOEvents.add_bank_account_start)
              await openPlaid({
                ...plaidParams,
                onSuccess: ({ publicToken }) => {
                  navigate(Screens.SyncBankAccountScreen, {
                    publicToken,
                  })
                },
                onExit: ({ error }) => {
                  if (error) {
                    navigate(Screens.LinkBankAccountErrorScreen, {
                      error,
                    })
                  }
                },
              })
            }}
          >
            <View style={styles.row}>
              <View style={styles.plusIconContainer}>
                <PlusIcon />
              </View>
              <View style={styles.accountLabels}>
                <Text style={styles.bankName}>{t('bankAccountsScreen.add')}</Text>
              </View>
            </View>
          </BorderlessButton>
        </View>
      )}
      <OptionsChooser
        isVisible={isOptionsVisible}
        options={[t('bankAccountsScreen.delete')]}
        includeCancelButton={true}
        isLastOptionDestructive={true}
        onOptionChosen={deleteBankAccount}
        onCancel={() => setIsOptionsVisible(false)}
      />
    </ScrollView>
  )
}

BankAccounts.navigationOptions = {
  ...emptyHeader,
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: variables.contentPadding,
    marginTop: 16,
  },
  accountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    height: 72,
    borderBottomWidth: 1,
    borderColor: colors.gray2,
  },
  addAccountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    height: 72,
    marginTop: 12,
  },
  accountLabels: {
    flexDirection: 'column',
  },
  rightSide: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  tripleDots: {
    padding: 10,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankName: {
    fontSize: 16,
  },
  bankImg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.gray2,
  },
  bankImgContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    padding: 10,
    backgroundColor: colors.gray2,
  },
  plusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    padding: 14,
    backgroundColor: colors.gray2,
  },
  backButton: {
    paddingLeft: 20,
  },
})

export default BankAccounts
