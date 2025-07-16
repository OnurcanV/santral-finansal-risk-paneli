.PHONY: fmt lint build backend frontend up down
fmt:
	cargo fmt --all

lint:
	cargo clippy --all-targets --all-features -- -D warnings || true

build:
	cargo build --workspace

backend:
	cd backend && cargo run

frontend:
	cd frontend && npm run dev

up:
	docker-compose up --build -d

down:
	docker-compose down
