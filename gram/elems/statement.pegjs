BlockOpen       = ws "{" ws EndOfLine? { indentCount += 1; return ''; }
BlockClose      = ws "}" ws { return ''; }
IndentBlockOpen = ws "@{" ws EndOfLine? { indentCount += 1; return ''; }
IndentBlockClose= ws "@}" ws { return ''; }
ParensOpen      = ws "(" ws
ParensClose     = ws ")" ws
BraceOpen       = ws "[" ws
BraceClose      = ws "]" ws

Coma            = ws "," ws
Dot             = "." ws
AssignationOp   = ws "=" ws
Colon           = ws ":" ws
EmptyStatement  = ""
This            = "@"
LineSpace       = ws EndOfLine ws
EndOfLine       = "\n"
ws              = " "* { return null }

Statement
  = ws
    body:(
      Comment
    / Expression
    / EmptyStatement
    )
    Comment?
    EndOfLine
  { return createNode('Statement', body || [], text()); }
