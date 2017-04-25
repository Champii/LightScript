_           = require 'lodash'
fs          = require 'fs.extra'
argv        = require 'commander'
path        = require 'path'
gulp        = require 'gulp'
steel       = require '..'

pack        = path.resolve __dirname, '../package.json'
version     = require(pack).version

argv
  .version(version)
  .usage '[options] <files ...>'
  .option '-c, --compile', 'Compile files'
  .option '-p, --print', 'Print files'
  .option '-o, --output <folder>', 'File/folder of output'
  .option '-s, --strict', 'Disallow implicite use of <Any> type'
  .option '-t, --typecript', 'Output Typescript instead of Javascript'
  .parse process.argv

paths = argv.args
compilePath = '.'

if not paths.length
  process.exit!

if argv.compile
  if argv.output
    compilePath = argv.output

  steel.transpileStream(gulp.src paths).pipe(gulp.dest compilePath)

else
  require path.resolve './', paths[0]
