.PHONY: build build-dev test test-cover clean run dev frontend frontend-test install lint fmt

frontend:
	cd frontend && npm install && npm run build
	rm -rf src/exporter/static/dist
	cp -r frontend/dist src/exporter/static/

frontend-test:
	cd frontend && npm install && npm test

build: frontend
	cargo build --release

build-dev:
	cargo build

test:
	cargo test

test-cover:
	cargo llvm-cov --html

clean:
	cargo clean
	rm -rf frontend/dist/ frontend/node_modules/ src/exporter/static/dist/

run: build
	./target/release/c4 $(ARGS)

dev: build-dev
	./target/debug/c4 serve -C ./examples/dispatch

install: frontend
	cargo install --path .

lint:
	cargo clippy -- -D warnings

fmt:
	cargo fmt
