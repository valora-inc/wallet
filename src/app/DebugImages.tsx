import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import LinearGradient from 'react-native-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Images from 'src/images/Images'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

// @ts-expect-error property "context" does not exist in the NodeRequire type,
// but it is available in the metro runtime
const icons = require.context('../icons', true, /\.tsx$/)
// @ts-expect-error
const images = require.context('../images', true, /\.tsx$/)

const ICON_SIZE = 32
const IMAGE_SIZE = 96

const IconItem = ({ Component, fileName }: { Component: React.ElementType; fileName: string }) => {
  return (
    <View style={styles.itemContainer}>
      {/* Not all icons have the same props, we do our best here to set consistent size and color */}
      <Component height={ICON_SIZE} width={ICON_SIZE} size={ICON_SIZE} color={Colors.black} />
      <Text>{fileName.split('.tsx')[0].slice(2)}</Text>
    </View>
  )
}

function DebugImages() {
  return (
    <LinearGradient
      colors={[Colors.white, Colors.gray3]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <ScrollView>
        <SafeAreaView edges={['bottom']}>
          <Text style={styles.title}>ICONS</Text>
          <View style={styles.container}>
            {icons.keys().map((iconFileName: string) => {
              return (
                <IconItem
                  key={iconFileName}
                  Component={icons(iconFileName).default}
                  fileName={iconFileName}
                />
              )
            })}
          </View>

          <Text style={styles.title}>IMAGES</Text>
          <View style={styles.container}>
            {images.keys().map((imageFileName: string) => {
              return (
                <IconItem
                  key={imageFileName}
                  Component={images(imageFileName).default}
                  fileName={imageFileName}
                />
              )
            })}
            {Object.keys(Images).map((key) => (
              <View style={styles.itemContainer} key={key}>
                <Image
                  // @ts-ignore
                  source={Images[key]}
                  style={styles.image}
                  resizeMode="contain"
                />
                <Text>{key}</Text>
              </View>
            ))}
          </View>
        </SafeAreaView>
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  itemContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.Regular16,
    marginBottom: Spacing.XLarge48,
    marginHorizontal: Spacing.Regular16,
  },
  image: {
    height: IMAGE_SIZE,
  },
  title: {
    ...typeScale.titleMedium,
    marginHorizontal: Spacing.Regular16,
    marginBottom: Spacing.Large32,
    textAlign: 'center',
  },
})

export default DebugImages
