{
  const _ = require('lodash');
  let variables   = [];
  let types       = {};
  let indentCount = 0;

  const Assignation = (identifier, assignable) => {
    if (!variables.includes(identifier)) {
      variables.push(identifier);
      identifier = `let ${identifier}`;
    }

    return `${identifier} = ${assignable}`;
  };

  const FunctionDeclaration = (args, noReturn, template, body) => {
    if (noReturn != null) {
      noReturn = createNode('NoReturn', [], '!');
    }

    template.children.push(args, noReturn, body);

    template.children = _.compact(template.children);

    return createNode('FunctionDeclaration', template);
  };

  const BlockIndentation = (body, open, close) => {
    // const indent = indentCount;


    // close = (' ').repeat(indentCount) + close

    const res = body.map(item => (' ').repeat(indentCount) + item);
    indentCount -= 2;

    // res.unshift(open + '\n');
    // res.push(close);

    return res.join('');
  };

  const AddReturnLast = () => {

  };

  const createNode = (symbol, children, literal) => {
    if (!_.isArray(children)) {
      children = [children];
    }

    if (literal == null) {
      literal = _(children)
        .map('literal')
        .join()
      ;
    }

    return {
      symbol,
      literal,
      children,
    };
  };
}

Root
  = head:Statement+
  { return createNode('Root', head); }

BlockOpen      = ws "{" ws EndOfLine? { indentCount += 1; return ''; }
BlockClose     = ws "}" ws { return ''; }
ParensOpen     = ws "(" ws
ParensClose    = ws ")" ws
BraceOpen      = ws "[" ws
BraceClose     = ws "]" ws

Coma           = ws "," ws
Dot            = "." ws
AssignationOp  = ws "=" ws
Colon          = ws ":" ws
EmptyStatement = ""

Statement
  = ws
    body:(
      Expression
    / EmptyStatement
    )
    EndOfLine
  { return createNode('Statement', body, text()); }

Expression
  = Assignation
  / Operation
  / BooleanExpr
  / Assignable
  / Return

Assignation "Assignation"
  = head:(
      ComputedProperty
    / Identifier
    )
    AssignationOp
    tail:Expression
  { return createNode('Assignation', [head, tail], text()); }

Assignable "Assignable"
  = Literal
  / If
  / Object
  / FunctionDeclaration
  / ComputedProperty
  / FunctionCall
  / Identifier

Operation
  = left:Assignable
    ws
    op:Operator
    ws
    right:Assignable
  { return createNode('Operation', [left, op, right]); }

Operator
  = op:(
      "+"
    / "-"
    / "*"
    / "/"
    )
  { return createNode('Operator', [], op); }

Block
  = body:(
      ass:Expression { return createNode('Statement', ass) }
    / BlockBraces
    )
  { return createNode('Block', body); }

FunctionBlock
  = block:Block
  { return createNode('FunctionBlock', block.children); }


BlockBraces "Block"
  = BlockOpen
    body:Statement+
    BlockClose
  { return body; }

FunctionDeclaration "FunctionDeclaration"
  = args:FunctionArguments?
    ws noReturn: "!"? ws
    template:(
      FunctionExpression
    / ArrowFunction
    )
    body:FunctionBlock
  { return FunctionDeclaration(args, noReturn, template, body); }

FunctionExpression "FunctionExpression"
  = ws "->" ws
  { return createNode('FunctionExpression', []); }

ArrowFunction "ArrowFunction"
  = ws "~>" ws
  { return createNode('ArrowFunction', []); }

FunctionArguments "FunctionArguments"
  = "(" ws
    args:FunctionArgument?
    ws ")"
  { return createNode('FunctionArguments', args); }

FunctionArgument "FunctionArgument"
  = head:Identifier
    tail:FunctionArgumentComa?
  {
    return _([head].concat(tail))
      .flatten()
      .compact()
      .value()
    ;
  }

FunctionArgumentComa "FunctionArgumentComa"
  = Coma
    arg:FunctionArgument
  { return arg; }

FunctionCall
  = ident: Identifier
    call:Call ws
  { return createNode('FunctionCall', [ident, call]); }

Call
  = call:(
      ParensCall
    / SpaceCall
    / BangCall
    )
  { return createNode('Call', call); }

ParensCall
  = "(" ws
    args: CallArg?
    ws ")"
  { return createNode('ParensCall', args || []); }

SpaceCall
  = " "+
    args: CallArg
    ws
  { return createNode('SpaceCall', args); }

BangCall
  = "!"
  { return createNode('BangCall', []); }

CallArg
  = args:CallArg_
  { return createNode('CallArg', args); }
CallArg_
  = head: Assignable
    tail: CallArgComa?
  {
    return _([head].concat(tail))
      .flatten()
      .compact()
      .value()
    ;
  }

CallArgComa
  = LineSpace?
    Coma
    arg: CallArg
  { return arg; }

Object
  =obj:(
      EmptyObject
    / ObjectBlock
    / ObjectProperties
    )
  { return createNode('Object', obj);}

EmptyObject
  = ws "{" ws "}" ws
  { return []; }

ObjectBlock
  = BlockOpen
    body: ObjectPropertyLine*
    BlockClose
  { return body; }

ObjectProperties
  = id:   Identifier
    Colon
    ass:  Assignable
    tail: ObjectPropertyComa?
  { return createNode('ObjectProperties', _.compact([id, ass, tail])); }

ObjectPropertyComa
  = Coma
    body: ObjectProperties
  { return createNode('ObjectPropertyComa', body); }

ObjectPropertyLine
  = ws
    prop: ObjectProperties
    ws
    Coma?
    EndOfLine?
  { return prop; }

ComputedProperty
  = id:(
      Literal
    / FunctionCall
    / Identifier
    )
    prop:PossibleComputedProperties+
  { return createNode('ComputedProperties', _.compact([id, ...prop])); }

PossibleComputedProperties
  = LineSpace?
    prop:(
      ComputedPropertiesDots
    / ComputedPropertiesBraces
    )
    call:Call? ws
  { return createNode('PossibleComputedProperties', _.compact([prop, call])); }

ComputedPropertiesBraces
  = BraceOpen
    prop:ComputedPropertiesTypes
    ws "]"
  {
    return createNode('ComputedPropertiesBraces', _.compact([prop]));
  }

ComputedPropertiesDots
  = Dot
    prop:(
      NumericComputedProperty
    / ComputedPropertiesTypes
    )
  { return createNode('ComputedPropertiesDots', _.compact([prop])); }

ComputedPropertiesTypes
  = Literal
  / ComputedProperty
  / FunctionCall
  / Identifier

NumericComputedProperty
  = Number
  { return createNode('NumericComputedProperty', [], text()); }

LineSpace
  = EndOfLine ws

If
  = "if"
    ws ass:Expression ws
    body:Block
    other:Else?
  { return createNode('If', _.compact([ass, body, other])); }

Else
  = EndOfLine "else"
    body:Block
  { return createNode('Else', body); }


Return
  = ws "return" ws
    expr:Expression
  { return createNode('Return', expr); }

BooleanExpr
  = left:Assignable
    ws
    test:TestOp
    ws
    right:Assignable
  { return createNode('BooleanExpr', [left, test, right]); }

TestOp
  = op:(
      "isnt"
    / "is"
    / "<"
    / "<="
    / ">"
    / ">="
    )
  { return createNode('TestOp', [], op); }

Literal "Literal"
  = body:(
      String
    / Number
    )
  { return createNode('Literal', body); }

Identifier "Identifier"
  = !TestOp
    $IdentifierChar+
  { return createNode('Identifier', [], text()); }

String "String"
  = QuotationMark
    Char*
    QuotationMark
  { return createNode('String', [], text()); }

QuotationMark "QuotationMark"
  = "'"

IdentifierChar "IdentifierChar"
  = [a-zA-Z]

Char "Char"
  = Unescaped
  / Escape sequence:(
      "'"
    / '"'
    / "\\"
    / "/"
    / "b" { return "\b"; }
    / "f" { return "\f"; }
    / "n" { return "\n"; }
    / "r" { return "\r"; }
    / "t" { return "\t"; }
  )
  { return sequence; }

Escape "Escape"
  = "\\"

Unescaped "Unescaped"
  = [^\0-\x1F\x22\x5C']

ws "WhiteSpace"
  = " "*
  { return null }

Number "Number"
  = [0-9]+
  { return createNode('Number', [], text()); }

EndOfLine "EndOfLine"
  = "\n"
