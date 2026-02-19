"""
AI ChatBot - Local Development Setup & Run Script
===================================================
This script automates the entire local development setup:
  1. Checks prerequisites (Node.js, npm, Docker)
  2. Starts PostgreSQL via Docker Compose
  3. Copies .env.example files if .env files don't exist (generates secure secrets)
  4. Installs npm dependencies
  5. Generates Prisma client & pushes schema to DB
  6. Starts the API and Web dev servers

Usage:
    python run.py          # Full setup + start dev servers
    python run.py --setup  # Only run setup steps (no dev servers)
    python run.py --start  # Skip setup, just start dev servers
"""

import os
import sys
import subprocess
import shutil
import secrets
import base64
import time
import signal
import argparse

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
API_DIR = os.path.join(ROOT_DIR, "apps", "api")
WEB_DIR = os.path.join(ROOT_DIR, "apps", "web")

# ── Helpers ──────────────────────────────────────────────────────────────────

def log(msg: str, level: str = "info"):
    colors = {"info": "\033[94m", "ok": "\033[92m", "warn": "\033[93m", "err": "\033[91m"}
    reset = "\033[0m"
    prefix = {"info": "ℹ", "ok": "✓", "warn": "⚠", "err": "✗"}
    print(f"  {colors.get(level, '')}{prefix.get(level, '·')} {msg}{reset}")


def run(cmd: str, cwd: str = ROOT_DIR, check: bool = True, capture: bool = False):
    """Run a shell command."""
    log(f"Running: {cmd}", "info")
    result = subprocess.run(
        cmd,
        shell=True,
        cwd=cwd,
        check=check,
        capture_output=capture,
        text=True,
    )
    return result


def command_exists(cmd: str) -> bool:
    """Check if a command is available on PATH."""
    return shutil.which(cmd) is not None


def generate_secret(length: int = 48) -> str:
    """Generate a cryptographically secure random string."""
    return secrets.token_urlsafe(length)


def generate_encryption_key() -> str:
    """Generate a 32-byte base64-encoded encryption key."""
    return base64.b64encode(secrets.token_bytes(32)).decode()


# ── Steps ────────────────────────────────────────────────────────────────────

def check_prerequisites():
    print("\n── Checking prerequisites ─────────────────────────────")
    ok = True

    for cmd, name in [("node", "Node.js"), ("npm", "npm")]:
        if command_exists(cmd):
            result = run(f"{cmd} --version", capture=True, check=False)
            version = result.stdout.strip() if result.returncode == 0 else "unknown"
            log(f"{name} found ({version})", "ok")
        else:
            log(f"{name} not found. Please install Node.js (https://nodejs.org)", "err")
            ok = False

    if command_exists("docker"):
        log("Docker found", "ok")
    else:
        log("Docker not found. Install Docker Desktop (https://docker.com)", "err")
        ok = False

    if not ok:
        log("Missing prerequisites. Please install them and try again.", "err")
        sys.exit(1)

    log("All prerequisites met!", "ok")


def start_postgres():
    print("\n── Starting PostgreSQL (Docker Compose) ───────────────")
    run("docker compose up -d postgres", cwd=ROOT_DIR)
    log("PostgreSQL container started", "ok")

    # Wait for Postgres to be ready
    log("Waiting for PostgreSQL to accept connections...", "info")
    for attempt in range(1, 16):
        result = run(
            'docker compose exec -T postgres pg_isready -U postgres',
            cwd=ROOT_DIR,
            check=False,
            capture=True,
        )
        if result.returncode == 0:
            log("PostgreSQL is ready!", "ok")
            return
        time.sleep(1)

    log("PostgreSQL did not become ready in time. Check Docker logs.", "warn")


def setup_env_files():
    print("\n── Setting up environment files ────────────────────────")

    # API .env
    api_env = os.path.join(API_DIR, ".env")
    api_env_example = os.path.join(API_DIR, ".env.example")
    if os.path.exists(api_env):
        log("apps/api/.env already exists, skipping", "ok")
    elif os.path.exists(api_env_example):
        log("Creating apps/api/.env with secure generated secrets", "info")
        with open(api_env_example, "r") as f:
            content = f.read()

        content = content.replace(
            "replace-with-a-long-access-secret-min-32-chars",
            generate_secret(),
        )
        content = content.replace(
            "replace-with-a-long-refresh-secret-min-32-chars",
            generate_secret(),
        )
        content = content.replace(
            "replace-with-32-byte-base64-or-strong-random-string",
            generate_encryption_key(),
        )

        with open(api_env, "w") as f:
            f.write(content)
        log("apps/api/.env created with secure secrets", "ok")
    else:
        log("apps/api/.env.example not found!", "err")

    # Web .env
    web_env = os.path.join(WEB_DIR, ".env")
    web_env_example = os.path.join(WEB_DIR, ".env.example")
    if os.path.exists(web_env):
        log("apps/web/.env already exists, skipping", "ok")
    elif os.path.exists(web_env_example):
        shutil.copy2(web_env_example, web_env)
        log("apps/web/.env created from example", "ok")
    else:
        log("apps/web/.env.example not found!", "err")


def install_dependencies():
    print("\n── Installing npm dependencies ─────────────────────────")
    run("npm install", cwd=ROOT_DIR)
    log("Dependencies installed", "ok")


def setup_database():
    print("\n── Setting up database (Prisma) ────────────────────────")
    run("npm run prisma:generate", cwd=ROOT_DIR)
    log("Prisma client generated", "ok")

    run("npm run prisma:push", cwd=ROOT_DIR)
    log("Database schema pushed", "ok")


def start_dev_servers():
    print("\n── Starting development servers ────────────────────────")
    log("API:  http://localhost:4000/api", "info")
    log("Web:  http://localhost:5173", "info")
    log("Press Ctrl+C to stop both servers\n", "warn")

    try:
        process = subprocess.Popen(
            "npm run dev",
            shell=True,
            cwd=ROOT_DIR,
        )

        def handle_signal(sig, frame):
            log("\nShutting down dev servers...", "warn")
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
            sys.exit(0)

        signal.signal(signal.SIGINT, handle_signal)
        signal.signal(signal.SIGTERM, handle_signal)

        process.wait()
    except KeyboardInterrupt:
        log("\nShutting down dev servers...", "warn")
        process.terminate()
        process.wait(timeout=5)


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="AI ChatBot - Local Dev Runner")
    parser.add_argument("--setup", action="store_true", help="Only run setup steps (no dev servers)")
    parser.add_argument("--start", action="store_true", help="Skip setup, just start dev servers")
    args = parser.parse_args()

    print("╔══════════════════════════════════════════════════════╗")
    print("║           AI ChatBot - Local Dev Runner             ║")
    print("╚══════════════════════════════════════════════════════╝")

    if args.start:
        start_dev_servers()
        return

    check_prerequisites()
    start_postgres()
    setup_env_files()
    install_dependencies()
    setup_database()

    if args.setup:
        print("\n── Setup complete! ─────────────────────────────────────")
        log("Run 'python run.py --start' or 'npm run dev' to start.", "ok")
        return

    start_dev_servers()


if __name__ == "__main__":
    main()
