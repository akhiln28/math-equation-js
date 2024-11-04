use std::ffi::{c_char, CString};

mod ast;
mod parser;

// #[wasm_bindgen]
// pub fn parse(expression: &str) -> String {
//     let parser = parser::Parser::new(expression);
//     let expression = parser.expression();
//     format!("{:#?}", expression)
// }

#[repr(C)]
pub struct WasmString {
    ptr: *const c_char,
    len: usize,
}

#[no_mangle]
pub extern "C" fn parse(expression: *const u8, length: usize) -> WasmString {
    let expression = unsafe { std::slice::from_raw_parts(expression, length) };
    let expression = std::str::from_utf8(expression).unwrap();
    let parser = parser::Parser::new(expression);
    let expression = parser.expression().unwrap();
    let expression = format!("{:#?}", expression);
    let expression_len = expression.len();
    let c_str = CString::new(expression).unwrap();
    WasmString {
        ptr: c_str.into_raw(),
        len: expression_len,
    }
}

// lib.rs
#[no_mangle]
pub extern "C" fn allocate_string(len: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(len);
    buf.resize(len, 0);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

#[no_mangle]
pub extern "C" fn deallocate_string(ptr: *mut u8, len: usize) {
    unsafe {
        let _ = Vec::from_raw_parts(ptr, len, len);
    }
}

#[repr(C)]
pub struct ResultStruct {
    ptr: *const u8,
    len: usize,
}

#[no_mangle]
pub extern "C" fn process_string(ptr: *const u8, len: usize) -> ResultStruct {
    // Convert input bytes to string
    let input_bytes = unsafe { std::slice::from_raw_parts(ptr, len) };
    let input_str = std::str::from_utf8(input_bytes).unwrap();

    // Process the string (in this example, make it uppercase)
    let result = input_str.to_uppercase();

    // Convert result to bytes and forget it so it's not dropped
    let result_bytes = result.into_bytes();
    let result_len = result_bytes.len();
    let result_ptr = result_bytes.as_ptr();
    std::mem::forget(result_bytes);

    ResultStruct {
        ptr: result_ptr,
        len: result_len,
    }
}

// Return type for struct example
#[repr(C)]
pub struct Person {
    age: i32,
    name_ptr: *const u8,
    name_len: usize,
}

#[no_mangle]
pub extern "C" fn create_person(name_ptr: *const u8, name_len: usize, age: i32) -> Person {
    let name_bytes = unsafe { std::slice::from_raw_parts(name_ptr, name_len) };
    let name = std::str::from_utf8(name_bytes).unwrap().to_string();

    let name_bytes = name.into_bytes();
    let name_len = name_bytes.len();
    let name_ptr = name_bytes.as_ptr();
    std::mem::forget(name_bytes);

    Person {
        age,
        name_ptr,
        name_len,
    }
}
