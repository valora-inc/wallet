import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Touchable from 'src/components/Touchable'
import { CeloNewsArticle } from 'src/exchange/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { formatDistanceToNow } from 'date-fns'

const IMAGE_SIZE = 44

interface Props {
  article: CeloNewsArticle
  testID?: string
}

export default function CeloNewsFeedItem({ article, testID }: Props) {
  function onPress() {
    // onSelect(text, data)
  }

  return (
    <Touchable onPress={onPress} testID={testID}>
      <View style={styles.contentContainer}>
        <View style={styles.row}>
          <Text style={styles.author} numberOfLines={1}>
            {article.author}
          </Text>
          <Text style={styles.date} numberOfLines={1}>
            {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.title}>{article.title}</Text>
          <Image source={{ uri: article.articleImage }} style={styles.image} />
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    marginHorizontal: Spacing.Thick24,
    marginTop: Spacing.Regular16,
    marginBottom: Spacing.Thick24,
    // flexDirection: 'row',
    // alignItems: 'center',
    // marginLeft: 16,
    // paddingVertical: 14,
    // borderBottomWidth: 1,
    // borderColor: colors.gray2,
    // backgroundColor: 'green',
  },
  author: {
    ...fontStyles.label,
    color: colors.goldDark,
    marginBottom: Spacing.Small12,
  },
  row: {
    flexDirection: 'row',
  },
  title: {
    ...fontStyles.regular,
    flex: 1,
    marginRight: 16,
  },
  date: {
    ...fontStyles.small,
    fontSize: 13,
    lineHeight: 16,
    color: colors.gray5,
    marginLeft: 4,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 4,
  },
  iconContainer: {
    marginRight: 16,
  },
})
