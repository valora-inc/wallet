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
import TripleDotVertical from 'src/icons/TripleDotVertical'
import {
  BankAccount,
  deleteFinclusiveBankAccount,
  getFinclusiveBankAccounts,
} from 'src/in-house-liquidity'
import { headerWithBackButton } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { dataEncryptionKeySelector, mtwAddressSelector } from 'src/web3/selectors'
import BorderlessButton from '@celo/react-components/components/BorderlessButton'
import { navigate } from 'src/navigator/NavigationService'
import openPlaid from './openPlaid'
import { plaidParamsSelector } from 'src/account/selectors'
import OptionsChooser from 'src/components/OptionsChooser'

type Props = StackScreenProps<StackParamList, Screens.BankAccounts>
function BankAccounts({ navigation, route }: Props) {
  const { t } = useTranslation()
  const [isOptionsVisible, setIsOptionsVisible] = useState(false)
  const [selectedBankId, setSelectedBankId] = useState(0)
  const accountMTWAddress = useSelector(mtwAddressSelector)
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
    try {
      const accounts = await getFinclusiveBankAccounts({
        dekPrivate,
        accountMTWAddress,
      })
      return accounts
    } catch {
      // TODO(wallet#1447): handle errors from IHL
      return
    }
  }, [newPublicToken])

  function getBankDisplay(bank: BankAccount) {
    return (
      <View key={bank.id} style={styles.accountContainer}>
        <View style={styles.row}>
          <View style={styles.bankImgContainer}>
            {
              // TODO(wallet#1825): Use real institution logo
            }
            <Image
              source={{ uri: 'https://www.chase.com/etc/designs/chase-ux/favicon-57.png' }}
              style={styles.bankImg}
            />
          </View>
          <View style={styles.accountLabels}>
            {
              // TODO(wallet#1825): Use institution name
            }
            <Text style={styles.bankName}>{`${
              bank.accountName
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
    try {
      await deleteFinclusiveBankAccount({
        accountMTWAddress,
        dekPrivate,
        id: selectedBankId,
      })
      await bankAccounts.execute()
    } catch {
      // TODO(wallet#1447): handle errors from IHL
    }
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
            <View style={styles.accountLabels}>
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
})

export default BankAccounts
