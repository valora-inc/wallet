const { DetoxCircusEnvironment } = require('detox/runners/jest')

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config, context) {
    super(config, context)

    // any custom code goes here
  }
}

module.exports = CustomDetoxEnvironment
