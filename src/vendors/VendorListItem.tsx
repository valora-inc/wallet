import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Pin from 'src/icons/Pin'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { Vendor } from 'src/vendors/types'

type Props = {
  key: string
  vendor: Vendor
  onPress: () => void
}

export default function VendorListItem({ vendor, key, onPress }: Props) {
  const { title, description, siteURI, logoURI } = vendor
  return (
    <TouchableOpacity key={key} onPress={onPress}>
      <View style={styles.vendorItem}>
        <Image source={{ uri: logoURI }} style={styles.vendorIcon} />
        <View style={styles.vendorDetails}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.right}>
          <TouchableOpacity onPress={() => {}} hitSlop={variables.iconHitslop}>
            <Pin size={17} color={Colors.gray3} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  vendorItem: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginVertical: 10,
  },
  vendorIcon: {
    resizeMode: 'contain',
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    shadowOffset: { width: 2, height: 2 },
    shadowColor: 'black',
    shadowOpacity: 0.2,
  },
  vendorDetails: {
    flexGrow: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  right: {
    paddingHorizontal: 30,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  title: {
    ...fontStyles.displayName,
  },
})
