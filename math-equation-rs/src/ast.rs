use std::fmt;
use std::fmt::Debug;

#[derive(Debug, PartialEq, Clone)]
pub enum Expression {
    UnaryExpression(Node<UnaryExpression>),
    BinaryExpression(Node<BinaryExpression>),
    PrimaryExpression(Node<PrimaryExpression>),
}

#[derive(Debug, PartialEq, Clone)]
pub struct UnaryExpression {
    pub op: Node<UnaryOperator>,
    pub expr: Box<Node<Expression>>,
}

#[derive(Debug, PartialEq, Clone)]
pub struct BinaryExpression {
    pub lhs: Box<Node<Expression>>,
    pub op: Node<BinaryOperator>,
    pub rhs: Box<Node<Expression>>,
}

#[derive(Debug, PartialEq, Clone)]
pub enum PrimaryExpression {
    Number(Node<i64>),
    Identifier(Node<String>),
    Array(Node<Array>),
    FunctionCall(Node<FunctionCall>),
    GroupedExpression(Box<Node<Expression>>),
}

#[derive(Debug, PartialEq, Clone)]
pub struct Array {
    pub elements: Vec<Node<Expression>>,
}

#[derive(Debug, PartialEq, Clone)]
pub struct FunctionCall {
    pub name: Node<String>,
    pub arguments: Vec<Node<Expression>>,
}

#[derive(Debug, PartialEq, Clone)]
pub enum UnaryOperator {
    Neg, // -
    Not, // !
    Inc, // ++
    Dec, // --
}

#[derive(Debug, PartialEq, Clone)]
pub enum BinaryOperator {
    Add, // +
    Sub, // -
    Mul, // *
    Div, // /
    Pow, // ^
    Eq,  // ==
    Ne,  // !=
    Lt,  // <
    Gt,  // >
    Le,  // <=
    Ge,  // >=
    And, // &&
    Or,  // ||
}

#[derive(Clone)]
pub struct Node<T>
where
    T: Debug,
{
    pub node: T,
    pub span: Span,
}

impl<T> Debug for Node<T>
where
    T: Debug,
{
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        if f.alternate() {
            write!(f, "{:#?}", self.node)
        } else {
            write!(f, "{:?}", self.node)
        }
    }
}

impl<T> PartialEq for Node<T>
where
    T: Debug + PartialEq,
{
    fn eq(&self, other: &Self) -> bool {
        self.node == other.node
    }
}

impl<T> Node<T>
where
    T: Debug,
{
    pub fn new(span: Span, node: T) -> Node<T> {
        Node { node, span }
    }
}

#[derive(Copy, Clone, Default, Debug)]
pub struct Span {
    pub start: usize,
    pub end: usize,
}

impl Span {
    pub fn span(start: usize, end: usize) -> Span {
        Span { start, end }
    }
}
