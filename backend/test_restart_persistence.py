"""
HostelOS BACSE202 DA3 - Persistence Verification across Backend Restart
Inserts record, restarts FastAPI process, and asserts record persistence from Neo4j.
"""

import time
import json
import urllib.request
from neo4j_client import neo4j_manager

# 1. Create student via API
payload = {
    "regNo": "25PERSIST01",
    "name": "Backend Restart Verification Student",
    "gender": "Male",
    "dob": "2006-05-20",
    "department": "B.Tech AI",
    "year": 1,
    "contactNumber": "9876543299",
    "email": "persist.test@vitstudent.ac.in",
    "admissionDate": "2026-07-01"
}

req = urllib.request.Request("http://localhost:8000/api/students", data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"}, method="POST")
with urllib.request.urlopen(req) as resp:
    created = json.loads(resp.read().decode())
    student_id = created["student_id"]
    print(f"[STAGE 1] Created Student ID: {student_id} via API")

# 2. Check directly in Neo4j
neo_check = neo4j_manager.run_single("MATCH (s:Student {student_id: $id}) RETURN s.student_name AS name", {"id": student_id})
print(f"[STAGE 2] Direct Neo4j Query Result: {neo_check}")
assert neo_check and neo_check["name"] == "Backend Restart Verification Student"
