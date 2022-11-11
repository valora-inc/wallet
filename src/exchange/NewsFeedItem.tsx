import { formatDistanceToNowStrict } from 'date-fns'
import React from 'react'
import { Image, Linking, StyleSheet, Text, View } from 'react-native'
import Card from 'src/components/Card'
import Touchable from 'src/components/Touchable'
import { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Shadow, Spacing } from 'src/styles/styles'

interface Props {
  author: string
  title: string
  url: string
  createdAt: string
  imgUrl?: string | null
}

function NewsFeedItem({ author, title, url, imgUrl, createdAt }: Props) {
  const openNewsItem = () => {
    Linking.openURL(url)
  }

  return (
    <Card style={styles.card} rounded={true} shadow={Shadow.SoftLight}>
      <Touchable style={styles.pressableCard} onPress={openNewsItem}>
        <>
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemTitleText}>
              {author} - {formatDistanceToNowStrict(new Date(createdAt))} ago
            </Text>
            <Text style={styles.itemSubtitleText}>{title}</Text>
          </View>
          {imgUrl !== null && (
            <Image style={styles.image} resizeMode="contain" source={{ uri: imgUrl }} />
          )}
        </>
      </Touchable>
    </Card>
  )
}

const styles = StyleSheet.create({
  itemSubtitleText: {
    ...fontStyles.small,
    color: Colors.gray5,
  },
  itemTitleText: {
    ...fontStyles.small,
    color: Colors.dark,
  },
  card: {
    backgroundColor: Colors.beige,
    marginTop: Spacing.Regular16,
    flex: 1,
    alignItems: 'center',
  },
  pressableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemTextContainer: {
    flexGrow: 1,
    marginRight: Spacing.Regular16,
  },
  image: {
    width: 64,
    height: 64,
  },
})

export default NewsFeedItem
