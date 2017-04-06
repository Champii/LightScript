fs   = require 'fs'
path = require 'path'
ts   = require 'typescript'

libSource = fs.readFileSync(path.join(path.dirname(require.resolve('typescript')), 'lib.d.ts')).toString()

createCompilerHost = (inputs, outputs) ->
  return
    getSourceFile: (filename, languageVersion) -> ts.createSourceFile filename, inputs[filename], ts.ScriptTarget.ES6, '0'
    writeFile: (name, text, writeByteOrderMark) -> outputs[name] = text
    getDefaultLibFileName: -> 'lib.d.ts'
    useCaseSensitiveFileNames: -> false
    getCanonicalFileName: (filename) -> filename
    getCurrentDirectory: -> ''
    getNewLine: -> '\n'

module.exports = (file) ->
  filename = path.basename file, '.s'
  dirname  = path.dirname file

  return (input) ->
    inputs =
      `${filename}.ts`: input
      'lib.d.ts': libSource
    outputs = {}

    compilerHost = createCompilerHost inputs, outputs
    program = ts.createProgram [`${filename}.ts`], { target: ts.ScriptTarget.ES6, module: ts.ModuleKind.AMD }, compilerHost

    emitResult = program.emit!

    allDiagnostics = emitResult.diagnostics

    errs = allDiagnostics.map (diagnostic) ->
      { line, character } = diagnostic.file.getLineAndCharacterOfPosition diagnostic.start
      message = ts.flattenDiagnosticMessageText diagnostic.messageText, '\n'
      `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`

    if emitResult.emitSkipped
      exitCode = 1
    else
      exitCode = 0

    if exitCode
      Promise.reject errs.join '\n'

    return
      filename: `${filename}.js`
      dirname
      output: outputs[`${filename}.js`]
