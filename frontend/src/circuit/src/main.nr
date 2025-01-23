
fn main(move: u8, nonce: [u8; 32]) -> pub  [u8; 32] {
  assert(move >= 1 & move <= 3, "Invalid move");
  
  std::hash::keccak256(concat_int_array(move, nonce), 33)
}

fn concat_int_array(a: u8, b: [u8; 32]) -> [u8; 33] {
    let mut result: [u8; 33] = [0; 33];
    
    result[0] = a;

    for i in 0..32 {
        result[1 + i] = b[i];
    }
    
    result
}


