"use strict"

const _     = require('lodash');
const ts    = require('typescript');
const util  = require('util');

const tokens = {}

let currentBlockIndent = 0;

// tokens.Statement = (node) => {
//   const res = compile(node.children);

//   const text = `${res.join('')}`;

//   if (res[0][res[0].length - 2] === ';' && res[0][res[0].length - 1] === '\n') {
//     return text;
//   }

//   return `${text};\n`;
// };

tokens.Expression = (node) => {
  const res = compile(node.children);

  const text = `${res.join('')}`;

  if (res[0][res[0].length - 2] === ';' && res[0][res[0].length - 1] === '\n') {
    return text;
  }

  return `${text};\n`;
};

tokens.VariableDeclaration = (node) => {
  const res = compile(node.children);

  return `const ${res.join(' = ')}`;
};

tokens.VariableName = (node) => {
  return node.literal;
};

tokens.Block = (node) => {
  currentBlockIndent += 2;

  let res = compile(node.children);

  const indent = _.repeat(' ', currentBlockIndent);

  currentBlockIndent -= 2;

  res = res.map(text => `${indent}${text}`);

  res.unshift('{\n');
  res.push(`${_.repeat(' ', currentBlockIndent)}}`);

  return res.join('')
};

tokens.Literal = (node) => {
  return node.literal;
};

tokens.FunctionArguments = (node) => {
  let res = compile(node.children);

  return `(${res.join(', ')})`;
};

const functionManage = (node) => {
  currentBlockIndent += 2;

  let res = compile(node.children);

  let args = '()';

  if (res[0][0] === '(') {
    args = res[0];
    res.shift();
  }

  if (res[0] === '!') {
    res.shift();
  } else {
    const lastStatement = res[res.length - 1];
    const lastStatementNode = node.children[node.children.length - 1];

    // @todo: return  at last leave of last ControlStruct
    if (!_.startsWith(lastStatementNode.literal, 'return') && lastStatementNode.children[0].symbol !== 'ControlStruct') {
      res[res.length - 1] = `return ${lastStatement}`;
    }
  }

  const indent = _.repeat(' ', currentBlockIndent);

  currentBlockIndent -= 2;

  res = res.map(text => `${indent}${text}`);
  res.push(`${_.repeat(' ', currentBlockIndent)}}`);
  res.unshift('{\n');

  return [args, res];
};

tokens.FunctionExpression = (node) => {
  let [args, res] = functionManage(node);

  return `function ${args} ${res.join('')}`;
};

tokens.ArrowFunction = (node) => {
  let [args, res] = functionManage(node);

  return `${args} => ${res.join('')}`;
};

tokens.FunctionCall = (node) => {
  const res = compile(node.children);
  const variableName = res.shift();

  return `${variableName}(${res.join('')})`;
};

tokens.CallArg = (node) => {
  const res = compile(node.children);

  return res.join(', ');
};

tokens.Cond = (node) => {
  const res = compile(node.children);

  return `if ${res.join('')}\n`;
}

tokens.Else = (node) => {
  const res = compile(node.children);

  return ` else ${res.join('')}\n`;
}

tokens.Test = (node) => {
  const res = compile(node.children);

  return `(${res.join(' ')}) `;
}

tokens.TestOp = (node) => {
  const res = compile(node.children);

  if (res[0] === 'is') {
    return '===';
  } else if (res[0] === 'isnt') {
    return '!==';
  }
}

tokens.Return = (node) => {
  const res = compile(node.children);

  return res.join('');
};

const compile = (nodes) => {
  if (!nodes.length) {
    return [];
  }

  return nodes
    .map(node => {
      const token = tokens[node.symbol];

      if (!node.symbol) {
        return node.literal;
      }

      if (token) {
        return token(node);
      }

      return compile(node.children).join('');
    })
  ;
};

const _compile = (nodes) => {
  return compile(nodes).join('');
};

module.exports = _compile;
