export default {
  setup: function (key, options = {}) {
    return new Promise((resolve) => resolve())
  },

  identify: function (userId, traits = {}) {},

  track: function (event, properties = {}) {},

  screen: function (name, properties = {}) {},

  group: function (groupId, traits = {}) {},

  alias: function (newId) {},

  reset: function () {},

  flush: function () {},

  enable: function () {},

  disable: function () {},
}
