import React from 'react'
import { FlatList, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import RecipientItem from 'src/recipients/RecipientItemV2'
import { Recipient } from 'src/recipients/recipient'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { isEqual } from 'lodash'

interface Props {
  testID?: string
  recipients: Recipient[]
  title?: string | null
  onSelectRecipient(recipient: Recipient): void
  selectedRecipient: Recipient | null
  isSelectedRecipientLoading: boolean
  style?: StyleProp<ViewStyle>
}

function RecipientPicker({
  testID,
  recipients,
  title,
  onSelectRecipient,
  selectedRecipient,
  isSelectedRecipientLoading,
  style,
}: Props) {
  return (
    <View style={[styles.body, style]} testID={testID}>
      {!!title && <Text style={styles.title}>{title}</Text>}
      <FlatList
        keyboardShouldPersistTaps={'always'}
        scrollEnabled={false}
        data={recipients}
        renderItem={({ item }) => (
          <RecipientItem
            recipient={item}
            onSelectRecipient={onSelectRecipient}
            selected={isEqual(item, selectedRecipient)}
            loading={isEqual(item, selectedRecipient) && isSelectedRecipientLoading}
          />
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  title: {
    ...typeScale.labelSmall,
    marginBottom: Spacing.Regular16,
    marginHorizontal: Spacing.Thick24,
    color: Colors.gray3,
  },
})

export default RecipientPicker
