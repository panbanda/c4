.PHONY: build build-dev test test-cover clean run dev frontend frontend-test install lint fmt validate-schema

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

test: validate-schema
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

validate-schema:
	@echo "Validating YAML schemas..."
	@command -v check-jsonschema >/dev/null 2>&1 || (echo "Installing check-jsonschema..." && pip install check-jsonschema)
	@check-jsonschema --schemafile _schema/mod.schema.json examples/*/c4.mod.yaml
	@check-jsonschema --schemafile _schema/c4.schema.json examples/*/shared/*.yaml
	@check-jsonschema --schemafile _schema/c4.schema.json examples/*/systems/*/*.yaml
	@check-jsonschema --schemafile _schema/c4.schema.json examples/*/flows/*.yaml 2>/dev/null || true
	@check-jsonschema --schemafile _schema/c4.schema.json examples/*/deployments/*.yaml 2>/dev/null || true
	@echo "Schema validation passed"
