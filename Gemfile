source "https://rubygems.org"

gem 'cocoapods', '~> 1.11', '>= 1.11.2'
gem "fastlane"
gem "xcpretty"

plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
eval_gemfile(plugins_path) if File.exist?(plugins_path)
