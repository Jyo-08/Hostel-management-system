#!/usr/bin/env bash
# HostelOS — One-Click Startup Script
# BACSE202 DA3 College Hostel Management System (Neo4j Graph Database)

echo "=========================================================="
echo " Starting HostelOS — College Hostel Management System     "
echo " Digital Assignment 3 — BACSE202 Database Systems         "
echo " Authoritative Database: Neo4j Graph Database             "
echo "=========================================================="

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# 1. Check Neo4j Connection & Schema Setup
echo "[1/3] Verifying Neo4j graph database connectivity..."
cd "$DIR/backend"
python3 test_neo4j_connection.py || {
    echo "[WARNING] Could not connect to Neo4j. Ensure Neo4j server is running on bolt://localhost:7687"
}

# 2. Launch FastAPI backend in background
echo "[2/3] Starting FastAPI backend on http://127.0.0.1:8000 ..."
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Trap signals to cleanly shutdown backend when script exits
trap "kill $BACKEND_PID 2>/dev/null; exit" SIGINT SIGTERM EXIT

# 3. Launch Vite frontend
echo "[3/3] Starting Vite frontend on http://localhost:5173 ..."
cd "$DIR/frontend"
npm run dev
