const { transform } = require('sucrase');

function getTransforms(filename) {
  if (
    filename.endsWith('.js') ||
    filename.endsWith('.jsx') ||
    filename.endsWith('.mjs')
  ) {
    return ['flow', 'jsx', 'imports', 'jest'];
  }

  return null;
}

exports.process = function process(src, filename) {
  const transforms = getTransforms(filename);
  if (transforms !== null) {
    return transform(src, { transforms, filePath: filename }).code;
  } else {
    return src;
  }
};
