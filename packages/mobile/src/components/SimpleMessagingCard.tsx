import CallToActionsBar, { CallToAction } from '@celo/react-components/components/CallToActionsBar'
import MessagingCard from '@celo/react-components/components/MessagingCard'
import fontStyles from '@celo/react-components/styles/fonts'
import React from 'react'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'

export interface Props {
  text: string
  icon?: ImageSourcePropType | React.ReactNode
  callToActions: CallToAction[]
  priority: number
  testID?: string
}

export default function SimpleMessagingCard({
  text,
  icon: iconProp,
  callToActions,
  testID,
}: Props) {
  const icon = iconProp ? (
    React.isValidElement(iconProp) ? (
      iconProp
    ) : (
      <Image
        // @ts-ignore isValidElement check above ensures image is an image source type
        source={iconProp}
        resizeMode="contain"
        style={styles.icon}
        testID={`${testID}/Icon`}
      />
    )
  ) : undefined

  return (
    <MessagingCard style={styles.container} testID={testID}>
      <View style={styles.innerContainer}>
        <View style={styles.content}>
          <Text style={styles.text} testID={`${testID}/Text`}>
            {text}
          </Text>
          <CallToActionsBar callToActions={callToActions} testID={`${testID}/CallToActions`} />
        </View>
        {!!icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>
    </MessagingCard>
  )
}

const styles = StyleSheet.create({
  container: {},
  innerContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  text: {
    ...fontStyles.large,
  },
  iconContainer: {
    marginLeft: 12,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: '100%',
    height: '100%',
  },
})
