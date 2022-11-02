import React from 'react'
import { WebView } from 'react-native-webview'

import { noHeader } from 'src/navigator/Headers'

export default function Invite() {
  // const { t } = useTranslation()
  // const shareUrl = useShareUrl()

  return (
    <>
      <WebView
        onError={(e) => console.warn(e)}
        onHttpError={(e) => console.warn(e)}
        onMessage={(m) => console.log(m)}
        originWhitelist={['*']}
        domStorageEnabled={true}
        javaScriptEnabled={true}
        loadsImagesAutomatically={true}
        defaultTextEncodingName={true}
        source={{
          html: '<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Happy 50th anniversary to the Wilderness Act! Here&#39;s a great wilderness photo from <a href="https://twitter.com/YosemiteNPS">@YosemiteNPS</a>. <a href="https://twitter.com/hashtag/Wilderness50?src=hash">#Wilderness50</a> <a href="http://t.co/HMhbyTg18X">pic.twitter.com/HMhbyTg18X</a></p>&mdash; US Dept of Interior (@Interior) <a href="https://twitter.com/Interior/status/507185938620219395">September 3, 2014</a></blockquote>n<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>',
        }}
      />
      <WebView
        originWhitelist={['*']}
        domStorageEnabled={true}
        javaScriptEnabled={true}
        loadsImagesAutomatically={true}
        defaultTextEncodingName={true}
        source={{
          html: '<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Happy 50th anniversary to the Wilderness Act! Here&#39;s a great wilderness photo from <a href="https://twitter.com/YosemiteNPS">@YosemiteNPS</a>. <a href="https://twitter.com/hashtag/Wilderness50?src=hash">#Wilderness50</a> <a href="http://t.co/HMhbyTg18X">pic.twitter.com/HMhbyTg18X</a></p>&mdash; US Dept of Interior (@Interior) <a href="https://twitter.com/Interior/status/507185938620219395">September 3, 2014</a></blockquote>n<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>',
        }}
      />
    </>
  )
}

Invite.navOptions = noHeader
