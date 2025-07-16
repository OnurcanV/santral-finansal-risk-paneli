.PHONY: fmt lint build backend frontend up down
fmt:
	cd backend && cargo fmt --all

lint:
	cd backend && cargo clippy --all-targets --all-features -- -D warnings || true

build:
	cd backend && cargo build

backend:
	cd backend && cargo run

frontend:
	cd frontend && npm run dev

up:
	docker-compose up --build -d

down:
	docker-compose down
