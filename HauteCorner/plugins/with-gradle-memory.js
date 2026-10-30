const { withGradleProperties } = require('expo/config-plugins');

const JVM_ARGS = '-Xmx4096m -XX:MaxMetaspaceSize=1024m';

// R8 is on by default in release builds since SDK 58, and runs out of metaspace
// with the template's limits of a 2 GB heap and 512 MB of metaspace.
module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (config) => {
    const property = config.modResults.find(
      (item) => item.type === 'property' && item.key === 'org.gradle.jvmargs',
    );
    if (property) {
      property.value = JVM_ARGS;
    } else {
      config.modResults.push({ type: 'property', key: 'org.gradle.jvmargs', value: JVM_ARGS });
    }
    return config;
  });
};
