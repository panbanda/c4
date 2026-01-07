fn main() {
    if let Err(e) = c4::cli::run() {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}
