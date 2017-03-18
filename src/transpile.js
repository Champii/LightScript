"use strict"

const _       = require('lodash');
const ts      = require('typescript');
const util    = require('util');

let tokens    = {};
let variables = [];
let types     = {};

let currentBlockIndent = 0;

// tokens.Statement = (node) => {
//   const res = transpile(node.children);

//   const text = `${res.join('')}`;

//   if (res[0][res[0].length - 2] === ';' && res[0][res[0].length - 1] === '\n') {
//     return text;
//   }

//   return `${text};\n`;
// };

tokens.TypeAssignation = (node) => {
  const res = transpile(node.children);

  const variable = res.shift();
  types[variable] = res[0];

  // console.log(res);

  return '';
};

tokens.TypeExpression = (node) => {
  const res = transpile(node.children);

  return res;
};

tokens.Expression = (node) => {
  const res = transpile(node.children);

  const text = `${res.join('')}`;

  if (res[0][res[0].length - 2] === ';' && res[0][res[0].length - 1] === '\n') {
    return text;
  }

  return `${text};\n`;
};

const applyTypes = (type, node) => {
  if (type.length === 1) {
    return `:${type[0]}`;
  }

  const argsNode = transpile(node.findSymbol('FunctionArgument').children[0].children)[0];

  const returnType = type.pop();

  const argsTypes = argsNode.map((arg, i) => `${arg}:${type[i]}`);

  return `:(${argsTypes}) => ${returnType}`;
};

tokens.Assignation = (node) => {
  const res = transpile(node.children);
  let text = '';


  if (!variables.includes(res[0])) {
    text += 'let ';
    variables.push(res[0]);
  }

  if (res[1][0] === ':') {
    res[0] = `${res[0]}${res[1]}`;
    res.splice(1, 1);
  } else if (types[res[0]]) {
    res[0] = `${res[0]}${applyTypes(types[res[0]], node)}`;
  }

  return `${text}${res.join(' = ')}`;
};

tokens.VariableName = (node) => {
  return node.literal;
};

tokens.Block = (node) => {
  currentBlockIndent += 2;

  let res = transpile(node.children);

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
  let res = transpile(node.children);

  return `(${res.join(', ')})`;
};

tokens.FunctionArgument = (node) => {
  let res = transpile(node.children);
  const arr = [];

  res.forEach(arg => {
    if (arg[0] === ':') {
      arr[arr.length - 1] = `${arr[arr.length - 1]}${arg}`;
    } else {
      arr.push(arg);
    }
  });

  return arr;
};

const functionManage = (node) => {
  currentBlockIndent += 2;

  let res = transpile(node.children);

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
  const res = transpile(node.children);
  const variableName = res.shift();

  return `${variableName}(${res.join('')})`;
};

tokens.CallArg = (node) => {
  const res = transpile(node.children);

  return res.join(', ');
};

tokens.Cond = (node) => {
  const res = transpile(node.children);

  const condition = res.shift();

  return `if (${condition}) ${res.join('')}\n`;
}

tokens.Else = (node) => {
  const res = transpile(node.children);

  return ` else ${res.join('')}\n`;
}

tokens.Test = (node) => {
  const res = transpile(node.children);

  return `${res.join(' ')}`;
}

tokens.TestOp = (node) => {
  const res = transpile(node.children);
  // return res[0];
  if (res[0] === 'is') {
    return '===';
  } else if (res[0] === 'isnt') {
    return '!==';
  }
}

tokens.Return = (node) => {
  const res = transpile(node.children);

  return res.join(' ');
};

tokens.Class = (node) => {
  const res = transpile(node.children);

  return `class ${res.join(' ')}`;
};

tokens.ClassBlock = (node) => {
  currentBlockIndent += 2;

  let res = transpile(node.children);

  const indent = _.repeat(' ', currentBlockIndent);

  currentBlockIndent -= 2;

  res = res.map(text => `${indent}${text}`);

  res.unshift('{\n');
  res.push(`${_.repeat(' ', currentBlockIndent)}}`);

  return res.join('')
};

tokens.ClassStatement = (node) => {
  const res = transpile(node.children);

  return `${res.join('')}\n`;
};

tokens.ClassMethodDeclaration = (node) => {
  const res = transpile(node.children);
  console.log(res);
  return `${res.join('')}\n`;
};

tokens.ClassMethod = (node) => {
  const res = transpile(node.children);
  console.log(res);
  return `${res.join('')}\n`;
};


const transpile = (nodes) => {
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

      return transpile(node.children).join('');
    })
  ;
};

const _transpile = (ast) => {
  variables = [];
  types = {};

  return transpile(ast.children).join('');
};

module.exports = _transpile;
