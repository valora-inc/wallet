import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useLayoutEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View, Image } from 'react-native'
import { useSelector } from 'react-redux'
import PlusIcon from 'src/icons/PlusIcon'
import TrippleDotVertical from 'src/icons/TrippleDotVertical'
import { deleteFinclusiveBankAccount, getFinclusiveBankAccount } from 'src/in-house-liquidity'
import { headerWithBackButton } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import Logger from 'src/utils/Logger'
import { dataEncryptionKeySelector, mtwAddressSelector } from 'src/web3/selectors'
import BorderlessButton from '@celo/react-components/components/BorderlessButton'
import { navigate } from 'src/navigator/NavigationService'
import openPlaid from './openPlaid'
import { plaidParamsSelector } from 'src/account/selectors'
import OptionsChooser from 'src/components/OptionsChooser'

const TAG = 'BankAccounts'

type Props = StackScreenProps<StackParamList, Screens.BankAccounts>
function BankAccounts({ navigation, route }: Props) {
  const { t } = useTranslation()
  const [isOptionsVisible, setIsOptionsVisible] = useState(false)
  const [selectedBankId, setSelectedBankId] = useState(0)
  const accountMTWAddress = useSelector(mtwAddressSelector) || ''
  const dekPrivate = useSelector(dataEncryptionKeySelector)
  const plaidParams = useSelector(plaidParamsSelector)
  const { newPublicToken } = route.params

  const header = () => {
    return (
      <View style={styles.header}>
        <Text style={fontStyles.navigationHeader}>{t('bankAccountsScreen.header')}</Text>
      </View>
    )
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: header,
    })
  }, [navigation])

  const bankAccounts = useAsync(async () => {
    if (!dekPrivate) {
      Logger.error(TAG, "Can't connect the users bank account because dekPrivate is null")
      return
    }
    const bankAccountsResponse = await getFinclusiveBankAccount({
      dekPrivate,
      accountMTWAddress,
    })
    if (!bankAccountsResponse.ok) {
      // TODO(wallet#1447): handle errors from IHL
      return
    }
    const accounts = await bankAccountsResponse.json()
    return accounts.bankAccounts
  }, [newPublicToken])

  function getBankDisplay(bank: {
    accountName: string
    accountNumberTruncated: string
    id: number
  }) {
    return (
      <View key={bank.id} style={styles.tokenContainer}>
        <View style={styles.row}>
          <View style={styles.bankImgContainer}>
            <Image
              source={{ uri: 'https://www.chase.com/etc/designs/chase-ux/favicon-57.png' }}
              style={styles.bankImg}
            />
          </View>

          <View style={styles.tokenLabels}>
            <Text style={styles.bankName}>{`${
              bank.accountName
            } (${bank.accountNumberTruncated.slice(-8)})`}</Text>
          </View>
        </View>
        <View style={styles.rightSide}>
          <BorderlessButton
            testID={`TrippleDot${bank.id}`}
            onPress={() => {
              setIsOptionsVisible(true)
              setSelectedBankId(bank.id)
            }}
          >
            <View style={styles.trippleDots}>
              <TrippleDotVertical />
            </View>
          </BorderlessButton>
        </View>
      </View>
    )
  }

  async function deleteBankAccount() {
    setIsOptionsVisible(false)
    if (!dekPrivate) {
      Logger.error(TAG, "Can't connect the users bank account because dekPrivate is null")
      return
    }
    const bankAccountsResponse = await deleteFinclusiveBankAccount({
      accountMTWAddress,
      dekPrivate,
      id: selectedBankId,
    })
    if (!bankAccountsResponse.ok) {
      return
    }
    await bankAccounts.execute()
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      {bankAccounts?.result?.map(getBankDisplay)}
      <View style={styles.addAccountContainer}>
        <BorderlessButton
          testID="AddAccount"
          onPress={() =>
            openPlaid({
              ...plaidParams,
              onSuccess: ({ publicToken }) => {
                navigate(Screens.SyncBankAccountScreen, {
                  publicToken,
                })
              },
              onExit: () => {
                // TODO(wallet#1447): handle errors from onExit
              },
            })
          }
        >
          <View style={styles.row}>
            <View style={styles.plusIconContainer}>
              <PlusIcon />
            </View>
            <View style={styles.tokenLabels}>
              <Text style={styles.bankName}>{t('bankAccountsScreen.add')}</Text>
            </View>
          </View>
        </BorderlessButton>
      </View>
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
  ...headerWithBackButton,
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: variables.contentPadding,
    marginTop: 16,
  },
  tokenContainer: {
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
  tokenLabels: {
    flexDirection: 'column',
  },
  rightSide: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  trippleDots: {
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
})

export default BankAccounts
