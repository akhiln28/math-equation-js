use core::str;
use std::{cell::RefCell, fmt::Debug, str::from_utf8};

use crate::ast::{
    Array, BinaryExpression, BinaryOperator, Expression, FunctionCall, Node, PrimaryExpression,
    Span, UnaryExpression, UnaryOperator,
};

pub struct Parser<'a> {
    pub input: &'a [u8],
    pub pos: RefCell<usize>,
}

#[derive(Debug)]
pub struct ParserError {
    pub pos: usize,
    pub message: String,
}

impl<'a> Parser<'a> {
    pub fn new(input: &'a str) -> Self {
        Parser {
            input: input.as_bytes(),
            pos: RefCell::new(0),
        }
    }

    pub fn tag_node(&self, tag: &str) -> Result<Node<()>, ParserError> {
        let start = *self.pos.borrow();
        if self.starts_with(tag) {
            *self.pos.borrow_mut() += tag.len();
            Ok(Node::new(Span::span(start, start + tag.len()), ()))
        } else {
            Err(self.parse_err(format!(
                "Expected '{}' but found {:?}",
                tag,
                self.slice(start, start + tag.len())?
            )))
        }
    }

    pub fn tag(&self, tag: &str) -> Result<&str, ParserError> {
        let start = *self.pos.borrow();
        if self.starts_with(tag) {
            *self.pos.borrow_mut() += tag.len();
            let ret = from_utf8(&self.input[start..start + tag.len()]).expect("Invalid utf8");
            Ok(ret)
        } else {
            Err(self.parse_err(format!(
                "Expected '{}' but found {:?}",
                tag,
                self.slice(start, start + tag.len())?
            )))
        }
    }

    pub fn slice(&self, start: usize, end: usize) -> Result<&str, ParserError> {
        if start < self.input.len() && end <= self.input.len() {
            Ok(from_utf8(&self.input[start..end]).expect("Invalid utf8"))
        } else {
            Err(self.parse_err(format!("Going out of bounds start: {} end: {}", start, end)))
        }
    }

    pub fn multispace0(&self) -> Result<(), ParserError> {
        while let Ok(true) = self.is_multispace() {
            self.consume();
        }
        Ok(())
    }

    pub fn is_multispace(&self) -> Result<bool, ParserError> {
        let cur = self.cur()?;
        Ok(cur == b' ' || cur == b'\n' || cur == b'\t' || cur == b'\r')
    }

    pub fn starts_with(&self, s: &str) -> bool {
        *self.pos.borrow() < self.input.len()
            && self.input[*self.pos.borrow()..].starts_with(s.as_bytes())
    }

    pub fn consume(&self) {
        *self.pos.borrow_mut() += 1;
    }

    pub fn pos(&self) -> usize {
        *self.pos.borrow()
    }

    pub fn set_pos(&self, pos: usize) {
        *self.pos.borrow_mut() = pos;
    }

    fn cur(&self) -> Result<u8, ParserError> {
        if *self.pos.borrow() < self.input.len() {
            Ok(self.input[*self.pos.borrow()])
        } else {
            Err(self.parse_err("Unexpected end of input".to_string()))
        }
    }

    pub fn expression(&self) -> Result<Node<Expression>, ParserError> {
        let unary_expr = self.unary_expression()?;
        let mut matched = Vec::new();
        self.multispace0()?;
        while let Ok(op) = self.binary_operator() {
            self.multispace0()?;
            let unary_expr = self.unary_expression()?;
            matched.push((op, unary_expr));
            self.multispace0()?;
        }
        let mut operand_stack: Vec<Node<Expression>> = vec![unary_expr];
        let mut operator_stack: Vec<Node<BinaryOperator>> = Vec::new();
        for (op, unary_expr) in matched {
            while !operator_stack.is_empty()
                && precedence(&operator_stack.last().unwrap().node) >= precedence(&op.node)
            {
                let right = operand_stack.pop().unwrap();
                let left = operand_stack.pop().unwrap();
                let operator = operator_stack.pop().unwrap();
                let expr_span = Span {
                    start: left.span.start,
                    end: right.span.end,
                };
                operand_stack.push(Node::new(
                    expr_span,
                    Expression::BinaryExpression(Node::new(
                        expr_span,
                        BinaryExpression {
                            lhs: Box::new(left),
                            op: operator,
                            rhs: Box::new(right),
                        },
                    )),
                ));
            }
            operand_stack.push(unary_expr);
            operator_stack.push(op);
        }
        while !operator_stack.is_empty() {
            let right = operand_stack.pop().unwrap();
            let left = operand_stack.pop().unwrap();
            let operator = operator_stack.pop().unwrap();
            let expr_span = Span {
                start: left.span.start,
                end: right.span.end,
            };
            operand_stack.push(Node::new(
                expr_span,
                Expression::BinaryExpression(Node::new(
                    expr_span,
                    BinaryExpression {
                        lhs: Box::new(left),
                        op: operator,
                        rhs: Box::new(right),
                    },
                )),
            ));
        }
        Ok(operand_stack.pop().unwrap())
    }

    pub fn unary_expression(&self) -> Result<Node<Expression>, ParserError> {
        let start = self.pos();
        if let Ok(op) = self.unary_operator() {
            let primary_expr = self.primary_expression()?;
            return Ok(Node::new(
                Span::span(start, self.pos()),
                Expression::UnaryExpression(Node::new(
                    Span::span(start, self.pos()),
                    UnaryExpression {
                        op: Some(op),
                        expr: Box::new(primary_expr),
                        is_prefix: true,
                    },
                )),
            ));
        }
        let primary_expr = self.primary_expression()?;
        if let Ok(op) = self.unary_operator() {
            return Ok(Node::new(
                Span::span(start, self.pos()),
                Expression::UnaryExpression(Node::new(
                    Span::span(start, self.pos()),
                    UnaryExpression {
                        op: Some(op),
                        expr: Box::new(primary_expr),
                        is_prefix: false,
                    },
                )),
            ));
        }
        Ok(primary_expr)
    }

    pub fn primary_expression(&self) -> Result<Node<Expression>, ParserError> {
        self.multispace0()?;
        let start = self.pos();
        if self.starts_with("(") {
            self.consume();
            let expr = self.expression()?;
            self.multispace0()?;
            self.tag(")")?;
            return Ok(Node::new(
                Span::span(start, self.pos()),
                Expression::PrimaryExpression(Node::new(
                    Span::span(start, self.pos()),
                    PrimaryExpression::GroupedExpression(Box::new(expr)),
                )),
            ));
        }
        if self.starts_with("[") {
            let array = self.array()?;
            return Ok(Node::new(
                Span::span(start, self.pos()),
                Expression::PrimaryExpression(Node::new(
                    Span::span(start, self.pos()),
                    PrimaryExpression::Array(array),
                )),
            ));
        }
        if self.starts_with_func_call() {
            let func_call = self.function_call()?;
            return Ok(Node::new(
                Span::span(start, self.pos()),
                Expression::PrimaryExpression(Node::new(
                    Span::span(start, self.pos()),
                    PrimaryExpression::FunctionCall(func_call),
                )),
            ));
        }
        if let Ok(number) = self.number() {
            return Ok(Node::new(
                Span::span(start, self.pos()),
                Expression::PrimaryExpression(Node::new(
                    Span::span(start, self.pos()),
                    PrimaryExpression::Number(number),
                )),
            ));
        }
        if let Ok(identifier) = self.identifier() {
            return Ok(Node::new(
                Span::span(start, self.pos()),
                Expression::PrimaryExpression(Node::new(
                    Span::span(start, self.pos()),
                    PrimaryExpression::Identifier(identifier),
                )),
            ));
        }
        Err(self.parse_err(format!(
            "Expected primary expression but found char {:?}",
            self.slice(start, start + 1)?
        )))
    }

    pub fn array(&self) -> Result<Node<Array>, ParserError> {
        let start = self.pos();
        self.tag("[")?;
        let mut elements = Vec::new();
        elements.push(self.expression()?);
        while self.starts_with(",") {
            self.consume();
            elements.push(self.expression()?);
        }
        self.tag("]")?;
        Ok(Node::new(Span::span(start, self.pos()), Array { elements }))
    }

    pub fn function_call(&self) -> Result<Node<FunctionCall>, ParserError> {
        let start = self.pos();
        let name = self.identifier()?;
        self.tag("(")?;
        self.multispace0()?;
        let mut arguments = Vec::new();
        if self.cur()? != b')' {
            arguments.push(self.expression()?);
            while self.starts_with(",") {
                self.consume();
                arguments.push(self.expression()?);
            }
        }
        self.tag(")")?;
        Ok(Node::new(
            Span::span(start, self.pos()),
            FunctionCall { name, arguments },
        ))
    }

    pub fn binary_operator(&self) -> Result<Node<BinaryOperator>, ParserError> {
        if let Ok(op) = self.tag_node("+") {
            Ok(Node::new(op.span, BinaryOperator::Add))
        } else if let Ok(op) = self.tag_node("-") {
            Ok(Node::new(op.span, BinaryOperator::Sub))
        } else if let Ok(op) = self.tag_node("*") {
            Ok(Node::new(op.span, BinaryOperator::Mul))
        } else if let Ok(op) = self.tag_node("/") {
            Ok(Node::new(op.span, BinaryOperator::Div))
        } else if let Ok(op) = self.tag_node("^") {
            Ok(Node::new(op.span, BinaryOperator::Pow))
        } else if let Ok(op) = self.tag_node("==") {
            Ok(Node::new(op.span, BinaryOperator::Eq))
        } else if let Ok(op) = self.tag_node("!=") {
            Ok(Node::new(op.span, BinaryOperator::Ne))
        } else if let Ok(op) = self.tag_node("<=") {
            Ok(Node::new(op.span, BinaryOperator::Le))
        } else if let Ok(op) = self.tag_node(">=") {
            Ok(Node::new(op.span, BinaryOperator::Ge))
        } else if let Ok(op) = self.tag_node("<") {
            Ok(Node::new(op.span, BinaryOperator::Lt))
        } else if let Ok(op) = self.tag_node(">") {
            Ok(Node::new(op.span, BinaryOperator::Gt))
        } else if let Ok(op) = self.tag_node("&&") {
            Ok(Node::new(op.span, BinaryOperator::And))
        } else if let Ok(op) = self.tag_node("||") {
            Ok(Node::new(op.span, BinaryOperator::Or))
        } else {
            Err(self.parse_err(format!(
                "Expected binary operator but found {}",
                self.cur()? as char
            )))
        }
    }

    pub fn unary_operator(&self) -> Result<Node<UnaryOperator>, ParserError> {
        let start = self.pos();
        let operator = if let Ok(_) = self.tag("!") {
            UnaryOperator::Not
        } else if let Ok(_) = self.tag("-") {
            UnaryOperator::Neg
        } else if let Ok(_) = self.tag("++") {
            UnaryOperator::Inc
        } else if let Ok(_) = self.tag("--") {
            UnaryOperator::Dec
        } else {
            return Err(self.parse_err(format!(
                "Expected unary operator but found {}",
                self.cur()? as char
            )));
        };
        Ok(Node::new(Span::span(start, self.pos()), operator))
    }

    pub fn number(&self) -> Result<Node<i64>, ParserError> {
        let start = self.pos();
        let mut is_negative = false;
        if self.starts_with("-") {
            self.consume();
            is_negative = true;
        }
        while let Ok(c) = self.cur() {
            if c.is_ascii_digit() {
                self.consume();
            } else {
                break;
            }
        }
        let num_str = self.slice(start, self.pos())?;
        let num = num_str
            .parse::<i64>()
            .map_err(|_| self.parse_err("Invalid number".to_string()))?;
        Ok(Node::new(
            Span::span(start, self.pos()),
            if is_negative { -num } else { num },
        ))
    }

    pub fn identifier(&self) -> Result<Node<String>, ParserError> {
        let start = self.pos();
        if !self.cur()?.is_ascii_alphabetic() {
            return Err(self.parse_err(format!(
                "Expected identifier but found {:?}",
                self.cur()? as char
            )));
        }
        self.consume();
        while let Ok(c) = self.cur() {
            if c.is_ascii_alphanumeric() || c == b'_' {
                self.consume();
            } else {
                break;
            }
        }
        Ok(Node::new(
            Span::span(start, self.pos()),
            self.slice(start, self.pos())?.to_string(),
        ))
    }

    fn parse_err(&self, message: String) -> ParserError {
        ParserError {
            pos: self.pos(),
            message,
        }
    }

    fn starts_with_func_call(&self) -> bool {
        let start = self.pos();
        let res = self.identifier().and_then(|_| self.tag("("));
        self.set_pos(start);
        res.is_ok()
    }
}

fn precedence(binary_operator: &BinaryOperator) -> u8 {
    match binary_operator {
        BinaryOperator::Or => 1,                      // ||
        BinaryOperator::And => 2,                     // &&
        BinaryOperator::Eq | BinaryOperator::Ne => 3, // ==, !=
        BinaryOperator::Lt | BinaryOperator::Gt | BinaryOperator::Le | BinaryOperator::Ge => 4, // <, >, <=, >=
        BinaryOperator::Add | BinaryOperator::Sub => 5, // +, -
        BinaryOperator::Mul | BinaryOperator::Div | BinaryOperator::Pow => 6, // *, /, ^
    }
}
