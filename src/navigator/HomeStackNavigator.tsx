import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import WalletHome from 'src/home/WalletHome'
import { headerWithBackButton, noHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import TransactionDetailsScreen from 'src/transactions/feed/TransactionDetailsScreen'
import TransactionHistoryFiltered from 'src/transactions/TransactionHistoryFiltered'

const Home = createStackNavigator()

export default function HomeStackNavigator() {
  return (
    <Home.Navigator initialRouteName={Screens.WalletHome}>
      <Home.Screen name={Screens.WalletHome} component={WalletHome} options={noHeader} />
      <Home.Screen
        name={Screens.TransactionDetailsScreen}
        component={TransactionDetailsScreen}
        options={{ ...headerWithBackButton }}
      />
      <Home.Screen
        name={Screens.TransactionHistoryFiltered}
        component={TransactionHistoryFiltered}
        options={TransactionHistoryFiltered.navigationOptions}
      />
    </Home.Navigator>
  )
}
