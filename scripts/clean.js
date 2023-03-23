const { globSync } = require('glob');
const rimraf = require('rimraf');
const meta = require('../package.json');

rimraf.sync(
  meta.files
    .filter(x => x !== 'LICENSE.md' && x !== 'README.md')
    .reduce((acc, x) => {
      const globbed = globSync(x);
      return globbed.length ? [...acc, ...globbed] : [...acc, x];
    }, [])
);
