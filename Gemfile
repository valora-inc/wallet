source "https://rubygems.org"

gem 'cocoapods', '>= 1.16.2', '< 1.17'
gem "fastlane"
gem "xcpretty"

plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
eval_gemfile(plugins_path) if File.exist?(plugins_path)
