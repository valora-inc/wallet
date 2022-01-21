import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useLayoutEffect } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View, Image } from 'react-native'
import { useSelector } from 'react-redux'
import PlusIcon from 'src/icons/PlusIcon'
import TrippleDotVertical from 'src/icons/TrippleDotVertical'
import { getFinclusiveBankAccount } from 'src/in-house-liquidity'
import { headerWithBackButton } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import Logger from 'src/utils/Logger'
import { dataEncryptionKeySelector, mtwAddressSelector } from 'src/web3/selectors'
import BorderlessButton from '@celo/react-components/components/BorderlessButton'

const TAG = 'BankAccounts'

type Props = StackScreenProps<StackParamList, Screens.BankAccounts>
function BankAccounts({ navigation }: Props) {
  const { t } = useTranslation()
  const accountMTWAddress = useSelector(mtwAddressSelector) || ''
  const dekPrivate = useSelector(dataEncryptionKeySelector)

  const header = () => {
    return (
      <View style={styles.header}>
        <Text style={fontStyles.navigationHeader}>{'Linked Bank Accounts'}</Text>
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
      console.debug('failed bank account get')
      return
    }
    const accounts = await bankAccountsResponse.json()
    console.debug(accounts)
    return accounts.bankAccounts
  }, [])
  console.debug(bankAccounts)

  function getBankDisplay(bank: { accountName: string; accountNumberTruncated: string }) {
    return (
      <View style={styles.tokenContainer}>
        <View style={styles.row}>
          <View style={styles.bankImgContainer}>
            <Image
              source={{ uri: 'https://www.chase.com/etc/designs/chase-ux/favicon-57.png' }}
              style={styles.bankImg}
            />
          </View>

          <View style={styles.tokenLabels}>
            <Text
              style={styles.bankName}
            >{`${bank.accountName} (${bank.accountNumberTruncated})`}</Text>
          </View>
        </View>
        <View style={styles.trippleDots}>
          <TrippleDotVertical />
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      {bankAccounts?.result?.map(getBankDisplay)}
      <View style={styles.addAccountContainer}>
        <BorderlessButton>
          <View style={styles.row}>
            <View style={styles.plusIconContainer}>
              <PlusIcon />
            </View>
            <View style={styles.tokenLabels}>
              <Text style={styles.bankName}>{'Add new bank account'}</Text>
            </View>
          </View>
        </BorderlessButton>
      </View>
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
  trippleDots: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 10,
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
