source "https://rubygems.org"


# Cocoapods 1.15 introduced a bug which break the build. We will remove the upper
# bound in the template on Cocoapods with next React Native release.
gem 'cocoapods', '>= 1.12.1', '< 1.15'
gem "fastlane"
gem "xcpretty"

plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
eval_gemfile(plugins_path) if File.exist?(plugins_path)
