mod ast;
mod parser;

fn main() {
    let expression = "1 + 2 * 3";
    let parser = parser::Parser::new(expression);
    let expression = parser.expression();
    println!("{:#?}", expression);
}
