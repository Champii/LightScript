var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var ts = require('typescript');
var libSource = fs.readFileSync(path.join(path.dirname(require.resolve('typescript')), 'lib.d.ts')).toString();
var createCompilerHost = function (inputs, outputs) {
    return { getSourceFile: function (filename, languageVersion) {
            return ts.createSourceFile(filename, inputs[filename], ts.ScriptTarget.ES6, '0');
        }, writeFile: function (name, text, writeByteOrderMark) {
            return outputs[name] = text;
        }, getDefaultLibFileName: function () {
            return 'lib.d.ts';
        }, useCaseSensitiveFileNames: function () {
            return false;
        }, getCanonicalFileName: function (filename) {
            return filename;
        }, getCurrentDirectory: function () {
            return '';
        }, getNewLine: function () {
            return '\n';
        } };
};
module.exports = function (file) {
    var filename = path.basename(file, '.s');
    var dirname = path.dirname(file);
    return function (input) {
        inputs = (_a = {}, _a[filename + ".ts"] = input, _a['lib.d.ts'] = libSource, _a);
        outputs = {};
        var compilerHost = createCompilerHost(inputs, outputs);
        var program = ts.createProgram([filename + ".ts"], { target: ts.ScriptTarget.ES6, module: ts.ModuleKind.AMD }, compilerHost);
        var emitResult = program.emit();
        var allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
        var errs = allDiagnostics.map(function (diagnostic) {
            var _a = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start), line = _a.line, character = _a.character;
            var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            return diagnostic.file.fileName + " (" + (line + 1) + "," + (character + 1) + "): " + message;
        });
        var exitCode = 0;
        if (emitResult.emitSkipped) {
            exitCode = 1;
        }
        errs = _.compact(errs);
        if (errs.length || exitCode) {
            return Promise.reject(errs.join('\n'));
        }
        return { filename: filename + ".js", dirname: dirname, output: outputs[filename + ".js"] };
        var _a;
    };
};
