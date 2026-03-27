const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Only apply Rork Metro on native builds
if (process.env.EXPO_PLATFORM !== "web") {
  try {
    const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
    module.exports = withRorkMetro(config);
  } catch {
    module.exports = config;
  }
} else {
  module.exports = config;
}
