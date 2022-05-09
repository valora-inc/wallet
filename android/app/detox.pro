# Needed for getAttributes to work in release mode
# TODO: remove when upstream detox includes it in its own proguard-rules-app.pro
-keep class com.google.android.material.** { *; }