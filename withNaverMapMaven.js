const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withNaverMapMaven(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let buildGradle = config.modResults.contents;
      const mavenUrl = "https://repository.map.naver.com/archive/maven";
      
      if (!buildGradle.includes(mavenUrl)) {
        // Inject right after mavenCentral() in allprojects { repositories { ... } }
        buildGradle = buildGradle.replace(
          /mavenCentral\(\)/g,
          `mavenCentral()\n        maven { url '${mavenUrl}' }`
        );
      }
      config.modResults.contents = buildGradle;
    }
    return config;
  });
};
