/**
  * @typedef {'GroupedExpression'|'Array'|'FunctionCall'|'Number'|'Identifier'} PrimaryExpressionType
  * @typedef {"UnaryExpression"|"BinaryExpression"|"PrimaryExpression"} ExpressionType
  * @typedef {'+'|'-'|'*'|'/'|'^'|'='|'=='|'!='|'<='|'>='|'<'|'>'|'&&'|'||'} BinaryOperator
  * @typedef {'-'|'!'|'++'|'--'} UnaryOperator
  */

/**
  * @template T
  */
export class AstNode {
  /**
    * @type {Span}
    */
  span;
  /**
    * @type {T}
    */
  node;

  /**
    * @param {Span} span
    * @param {T} node
    * @returns {AstNode<T>}
    */
  constructor(span, node) {
    this.span = span;
    this.node = node;
  }
}

export class Span {
  /**
    * @param {number} start
    * @param {number} end
    */
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }
}

export class Expression {
  /**
    * @type {ExpressionType}
    */
  type;
  /**
    * @type {UnaryExpression|BinaryExpression|PrimaryExpression}
    */
  expr;

  /**
    * @param {ExpressionType} type
    * @param {UnaryExpression|BinaryExpression|PrimaryExpression} expr
    */
  constructor(type, expr) {
    this.type = type;
    this.expr = expr;
  }

  /**
    * Print nicely in a concise format. 
    * Example:
    * 2 + 3 * 4 => binExp(2, +, binExp(3, *, 4))
    */
  toString() {
    return this.expr.toString();
  }

  /**
    * Generate math ml element for the expression.
    * @returns {HTMLElement}
    */
  toMathML() {
    return this.expr.toMathML();
  }
}

// UnaryExpression ::= UnaryOperator PrimaryExpression | PrimaryExpression UnaryOperator
export class UnaryExpression {
  /**
    * @param {UnaryOperator} op
    * @param {AstNode<Expression>} expr
    * @param {boolean} isPrefix
    * @returns {UnaryExpression}
    **/
  constructor(op, expr, isPrefix) {
    this.op = op;
    this.expr = expr;
    this.isPrefix = isPrefix;
  }

  /**
    * Print nicely in a concise format.
    * Example:
    * -3 => unExp(-, 3)
    *  3++ => unExp(3, ++)
    *  !true => unExp(!, true)
    */
  toString() {
    if (this.isPrefix) {
      return `unExp(${this.op}, ${this.expr.toString()})`;
    }
    return `unExp(${this.expr.toString()}, ${this.op})`;
  }

  /**
    * Generate math ml element for the UnaryExpression.
    * @returns {HTMLElement}
    */
  toMathML() {
    let mrow = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mrow');
    if (this.isPrefix) {
      let mo = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mo');
      mo.textContent = this.op;
      mrow.appendChild(mo);
      mrow.appendChild(this.expr.toMathML());
    } else {
      mrow.appendChild(this.expr.toMathML());
      let mo = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mo');
      mo.textContent = this.op;
      mrow.appendChild(mo);
    }
    return mrow;
  }
}

export class BinaryExpression {
  /**
    * @param {AstNode<Expression>} lhs
    * @param {AstNode<string>} op
    * @param {AstNode<Expression>} rhs
    * @returns {BinaryExpression}
    **/
  constructor(lhs, op, rhs) {
    this.lhs = lhs;
    this.op = op;
    this.rhs = rhs;
  }

  /**
    * Print nicely in a concise format.
    * Example:
    * 2 + 3 * 4 => binExp(2, +, binExp(3, *, 4))
    */
  toString() {
    return `binExp(${this.lhs.node.toString()}, ${this.op.node}, ${this.rhs.node.toString()})`;
  }

  /**
    * Generate math ml element for the BinaryExpression.
    * @returns {HTMLElement}
    */
  toMathML() {
    if (this.op.node === '/') {
      let mfrac = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mfrac');
      mfrac.appendChild(this.lhs.node.toMathML());
      mfrac.appendChild(this.rhs.node.toMathML());
      return mfrac;
    } else if (this.op.node === '^') {
      let msup = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'msup');
      msup.appendChild(this.lhs.node.toMathML());
      msup.appendChild(this.rhs.node.toMathML());
      return msup;
    } else if (this.op.node === '==') {
      let mrow = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mrow');
      mrow.appendChild(this.lhs.node.toMathML());
      let mo = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mo');
      // replace the textContent with the unicode equivalent triple equals
      mo.textContent = '≡';
      mrow.appendChild(mo);
      mrow.appendChild(this.rhs.node.toMathML());
      return mrow;
    } else if (this.op.node === '!=') {
      let mrow = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mrow');
      mrow.appendChild(this.lhs.node.toMathML());
      let mo = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mo');
      mo.textContent = '≠';
      mrow.appendChild(mo);
      mrow.appendChild(this.rhs.node.toMathML());
      return mrow;
    } else if (this.op.node === '<=') {
      let mrow = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mrow');
      mrow.appendChild(this.lhs.node.toMathML());
      let mo = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mo');
      mo.textContent = '≤';
      mrow.appendChild(mo);
      mrow.appendChild(this.rhs.node.toMathML());
      return mrow;
    } else if (this.op.node === '>=') {
      let mrow = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mrow');
      mrow.appendChild(this.lhs.node.toMathML());
      let mo = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mo');
      mo.textContent = '≥';
      mrow.appendChild(mo);
      mrow.appendChild(this.rhs.node.toMathML());
      return mrow;
    } else if (this.op.node === '&&') {
      let mrow = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mrow');
      mrow.appendChild(this.lhs.node.toMathML());
      let mo = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mo');
      mo.textContent = '∧';
      mrow.appendChild(mo);
      mrow.appendChild(this.rhs.node.toMathML());
      return mrow;
    } else if (this.op.node === '||') {
      let mrow = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mrow');
      mrow.appendChild(this.lhs.node.toMathML());
      let mo = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mo');
      mo.textContent = '∨';
      mrow.appendChild(mo);
      mrow.appendChild(this.rhs.node.toMathML());
      return mrow;
    } else {
      let mrow = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mrow');
      mrow.appendChild(this.lhs.node.toMathML());
      let mo = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mo');
      mo.textContent = this.op.node;
      mrow.appendChild(mo);
      mrow.appendChild(this.rhs.node.toMathML());
      return mrow;
    }
  }
}

export class PrimaryExpression {
  /**
    * @type {PrimaryExpressionType}
    */
  type;
  /**
    * @type {GroupedExpression|ArrayExpression|FunctionCall|number|string}
    */
  value;
  /**
    * @param {PrimaryExpressionType} type
    * @param {GroupedExpression|ArrayExpression|FunctionCall|number|string} value
    * @returns {PrimaryExpression}
    */
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }

  /**
    * Print nicely in a concise format.
    * Example:
    * 3 => 3
    * [1, 2, 3] => [1, 2, 3]
    * foo() => foo()
    */
  toString() {
    return this.value.toString();
  }

  /**
    * Generate math ml element for the PrimaryExpression.
    * @returns {HTMLElement}
    */
  toMathML() {
    switch (this.type) {
      case 'GroupedExpression':
        return this.value.toMathML();
      case 'Array':
        return this.value.toMathML();
      case 'FunctionCall':
        return this.value.toMathML();
      case 'Number':
        let mn = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mn');
        mn.textContent = this.value;
        return mn;
      case 'Identifier':
        let mi = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mi');
        mi.textContent = this.value;
        return mi;
    }
  }
}

export class ArrayExpression {
  /**
    * @type {AstNode<Expression>[]}
    */
  elements;
  /**
    * @param {AstNode<Expression>[]} elements
    */
  constructor(elements) {
    this.elements = elements;
  }

  /**
    * Print nicely in a concise format.
    * Example:
    * [1, 2, 3] => [1, 2, 3]
    */
  toString() {
    return `[${this.elements.map(e => e.toString()).join(', ')}]`;
  }
}

export class FunctionCall {
  /**
    * @type {AstNode<string>}
    */
  name;
  /**
    * @type {AstNode<Expression>[]}
    */
  args;

  /**
    * @param {AstNode<string>} name
    * @param {AstNode<Expression>[]} args
    * @returns {FunctionCall}
    */
  constructor(name, args) {
    this.name = name;
    this.args = args;
  }

  /**
    * Print nicely in a concise format.
    * Example:
    * foo(1, 2, 3) => foo(1, 2, 3)
    */
  toString() {
    return `${this.name.toString()}(${this.args.map(e => e.toString()).join(', ')})`;
  }

  toMathML() {
    let mrow = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mrow');
    let mi = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'mi');
    mi.textContent = this.name.node;
    mrow.appendChild(mi);
    this.args.forEach(arg => {
      mrow.appendChild(arg.toMathML());
    });
    return mrow;
  }
}

/**
  * @param {BinaryOperator} op
  * @returns {number}
  */
function precedence(op) {
  switch (op) {
    case '=': return 0;
    case '|': return 1;
    case '&': return 2;
    case '==':
    case '!=': return 3;
    case '<':
    case '>':
    case '<=':
    case '>=': return 4;
    case '+':
    case '-': return 5;
    case '*':
    case '/':
    case '^': return 6;
  }
}

/**
  * Parses a mathematical expression and returns an abstract syntax tree.
  * The grammar is as follows:
  * expression := unaryExpression (binaryOperator unaryExpression)*
  * unaryExpression := unaryOperator primaryExpression | primaryExpression unaryOperator
  * primaryExpression := '(' expression ')' | '[' expression (',' expression)* ']' | functionCall | number | identifier
  * functionCall := identifier '(' (expression (',' expression)*)? ')'
  * binaryOperator := '+' | '-' | '*' | '/' | '^' | '==' | '!=' | '<=' | '>=' | '<' | '>' | '&&' | '||'
  * unaryOperator := '-' | '!' | '++' | '--'
  * number := '-'? [0-9]+
  * identifier := [a-zA-Z][a-zA-Z0-9_]*
  */
export class Parser {
  /**
    * @param {string} input
    * @returns {AstNode}
    */
  constructor(input) {
    this.input = input;
    this.pos = 0;
  }

  /**
    * @returns {AstNode<Expression>}
    * @throws {Error}
    */
  parse() {
    return this.expression();
  }

  /**
    * @returns {AstNode}
    * @throws {Error}
    * expression := unaryExpression (binaryOperator unaryExpression)*
    */
  expression() {
    // console.log('expression');
    let unaryExprAstNode = this.unaryExpression();
    // console.log('unaryExprAstNode', unaryExprAstNode);
    let matched = [];
    this.skipWhitespace();

    let binOp = this.binaryOperator();
    while (binOp) {
      this.skipWhitespace();
      let unaryExpr = this.unaryExpression();
      // console.log('binOp', binOp);
      // console.log('unaryExpr', unaryExpr);
      matched.push({ op: binOp, unaryExpr });
      this.skipWhitespace();
      binOp = this.binaryOperator();
    }

    let operandStack = [unaryExprAstNode];
    let operatorStack = [];

    matched.forEach(({ op, unaryExpr }) => {
      while (operatorStack.length && precedence(operatorStack[operatorStack.length - 1]) >= precedence(op)) {
        let right = operandStack.pop();
        let left = operandStack.pop();
        let operator = operatorStack.pop();
        operandStack.push(new AstNode(
          new Span(left.span.start, right.span.end),
          new Expression('BinaryExpression', new BinaryExpression(left, operator, right))
        ));
      }
      operandStack.push(unaryExpr);
      operatorStack.push(op);
    });

    while (operatorStack.length) {
      let right = operandStack.pop();
      let left = operandStack.pop();
      let operator = operatorStack.pop();
      operandStack.push(new AstNode(
        new Span(left.span.start, right.span.end),
        new Expression('BinaryExpression', new BinaryExpression(left, operator, right))
      ));
    }

    return operandStack.pop();
  }

  /**
    * @returns {AstNode<UnaryExpression>}
    * @throws {Error}
    */
  unaryExpression() {
    let start = this.pos;
    let op = this.unaryOperator();
    if (op) {
      let primaryExpr = this.primaryExpression();
      return new AstNode(
        new Span(start, this.pos),
        new Expression('UnaryExpression', new UnaryExpression(op, primaryExpr, true))
      );
    }
    let primaryExprAstNode = this.primaryExpression();
    op = this.unaryOperator();
    if (op) {
      return new AstNode(
        new Span(start, this.pos),
        new Expression('UnaryExpression', new UnaryExpression(op, primaryExprAstNode, false))
      );
    }
    return primaryExprAstNode;
  }

  // primaryExpression := '(' expression ')' | '[' expression (',' expression)* ']' | functionCall | number | identifier
  primaryExpression() {
    // console.log('primaryExpression');
    this.skipWhitespace();
    let start = this.pos;
    if (this.match('(')) {
      // console.log('grouped expression');
      let expr = this.expression();
      this.match(')');
      return new AstNode(
        new Span(start, this.pos),
        new Expression('PrimaryExpression', new PrimaryExpression('GroupedExpression', expr))
      );
    }
    if (this.match('[')) {
      // console.log('array expression');
      let elements = [];
      elements.push(this.expression());
      while (this.match(',')) {
        elements.push(this.expression());
      }
      this.match(']');
      return new AstNode(
        new Span(start, this.pos),
        new Expression('PrimaryExpression', new PrimaryExpression('Array', new ArrayExpression(elements)))
      );
    }
    if (this.startsWithFuncCall()) {
      // console.log('function call');
      let funcCall = this.functionCall();
      return new AstNode(
        new Span(start, this.pos),
        new Expression('PrimaryExpression', new PrimaryExpression('FunctionCall', funcCall))
      );
    }
    if (this.isDigit(this.peek())) {
      // console.log('number');
      let number = this.number();
      // console.log(number);
      return new AstNode(
        new Span(start, this.pos),
        new Expression('PrimaryExpression', new PrimaryExpression('Number', number))
      );
    }
    if (this.isAlpha(this.peek())) {
      // console.log('identifier');
      let identifier = this.identifier();
      return new AstNode(
        new Span(start, this.pos),
        new Expression('PrimaryExpression', new PrimaryExpression('Identifier', identifier))
      );
    }
    throw new Error(`Expected primary expression but found ${this.peek()}`);
  }

  array() {
    let start = this.pos;
    this.match('[');
    let elements = [];
    elements.push(this.expression());
    while (this.match(',')) {
      elements.push(this.expression());
    }
    this.match(']');
    return new AstNode(new Span(start, this.pos), new ArrayExpression(elements));
  }

  functionCall() {
    let start = this.pos;
    let name = this.identifier();
    this.match('(');
    let args = [];
    if (this.peek() !== ')') {
      args.push(this.expression());
      while (this.match(',')) {
        args.push(this.expression());
      }
    }
    this.match(')');
    return new AstNode(new Span(start, this.pos), new FunctionCall(name, args));
  }

  /**
    * @returns {BinaryOperator}
    */
  binaryOperator() {
    let start = this.pos;
    if (this.match('+')) return new AstNode(new Span(start, this.pos), '+');
    if (this.match('-')) return new AstNode(new Span(start, this.pos), '-');
    if (this.match('*')) return new AstNode(new Span(start, this.pos), '*');
    if (this.match('/')) return new AstNode(new Span(start, this.pos), '/');
    if (this.match('^')) return new AstNode(new Span(start, this.pos), '^');
    if (this.match('==')) return new AstNode(new Span(start, this.pos), '==');
    if (this.match('=')) return new AstNode(new Span(start, this.pos), '=');
    if (this.match('!=')) return new AstNode(new Span(start, this.pos), '!=');
    if (this.match('<=')) return new AstNode(new Span(start, this.pos), '<=');
    if (this.match('>=')) return new AstNode(new Span(start, this.pos), '>=');
    if (this.match('<')) return new AstNode(new Span(start, this.pos), '<');
    if (this.match('>')) return new AstNode(new Span(start, this.pos), '>');
    if (this.match('&&')) return new AstNode(new Span(start, this.pos), '&&');
    if (this.match('||')) return new AstNode(new Span(start, this.pos), '||');
    return
  }

  /**
    * @returns {UnaryOperator}
    */
  unaryOperator() {
    let start = this.pos;
    if (this.match('!')) return new AstNode(new Span(start, this.pos), UnaryOperator.NOT);
    if (this.match('-')) return new AstNode(new Span(start, this.pos), UnaryOperator.NEG);
    if (this.match('++')) return new AstNode(new Span(start, this.pos), UnaryOperator.INC);
    if (this.match('--')) return new AstNode(new Span(start, this.pos), UnaryOperator.DEC);
    return null;
  }

  number() {
    let start = this.pos;
    let isNegative = false;
    if (this.match('-')) {
      isNegative = true;
    }
    while (this.isDigit(this.peek())) {
      this.consume();
    }
    let numStr = this.input.slice(start, this.pos);
    let num = parseInt(numStr, 10);
    return isNegative ? -num : num;
  }

  identifier() {
    let start = this.pos;
    if (!this.isAlpha(this.peek())) {
      throw new Error(`Expected identifier but found ${this.peek()}`);
    }
    this.consume();
    while (this.isAlphaNumeric(this.peek()) || this.peek() === '_') {
      this.consume();
    }
    return this.input.slice(start, this.pos);
  }

  match(str) {
    if (this.input.slice(this.pos, this.pos + str.length) === str) {
      this.pos += str.length;
      return true;
    }
    return false;
  }

  consume() {
    this.pos++;
  }

  peek() {
    return this.input[this.pos];
  }

  skipWhitespace() {
    while (this.isWhitespace(this.peek())) {
      this.consume();
    }
  }

  isWhitespace(char) {
    return char === ' ' || char === '\n' || char === '\t' || char === '\r';
  }

  isDigit(char) {
    return char >= '0' && char <= '9';
  }

  isAlpha(char) {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
  }

  isAlphaNumeric(char) {
    return this.isAlpha(char) || this.isDigit(char);
  }

  startsWithFuncCall() {
    let start = this.pos;
    try {
      this.identifier();
      return this.match('(');
    } finally {
      this.pos = start;
      return false;
    }
  }
}

/**
  * @param {string} input
  * @returns {HTMLElement}
  */
export function generateMathML(input) {
  const parser = new Parser(input);
  const ast = parser.parse();
  console.log(ast.node.toString());
  return ast.node.toMathML();
}


