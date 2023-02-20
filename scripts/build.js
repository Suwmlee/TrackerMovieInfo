const { userScriptComment } = require('./banner');

require('esbuild').build({
  entryPoints: ['src/index.js'],
  outfile: 'dist/tracker-movie-info.user.js',
  bundle: true,
  sourcemap: false,
  banner: {
    js: userScriptComment,
  },
}).catch(() => process.exit(1));
