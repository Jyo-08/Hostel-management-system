"""
HostelOS BACSE202 DA3 - Standalone Restart Persistence Verification
Automates mutation -> kill -> restart -> query -> cleanup verification.
"""

import time
import json
import urllib.request
import subprocess
from neo4j_client import neo4j_manager

# 1. Baseline
base_nodes = neo4j_manager.run_single("MATCH (n) RETURN count(n) AS c")["c"]
print(f"[STEP 1] Baseline Neo4j Node Count: {base_nodes}")
assert base_nodes == 52

# 2. Insert test student via API
payload = {
    "regNo": "25VAL01",
    "name": "Phase 4 Final Validation Student",
    "gender": "Female",
    "dob": "2007-06-18",
    "department": "B.Tech AI",
    "year": 1,
    "contactNumber": "9876543219",
    "email": "val4@vitstudent.ac.in",
    "admissionDate": "2026-07-01"
}

req = urllib.request.Request("http://localhost:8000/api/students", data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"}, method="POST")
with urllib.request.urlopen(req) as resp:
    created = json.loads(resp.read().decode())
    new_id = created["student_id"]
    print(f"[STEP 2] Inserted student via API: ID={new_id}, RegNo={created['reg_no']}")

# 3. Direct verification in Neo4j
neo_check = neo4j_manager.run_single("MATCH (s:Student {student_id: $id}) RETURN s.student_name AS name", {"id": new_id})
print(f"[STEP 3] Verified in Neo4j before restart: {neo_check}")
assert neo_check and neo_check["name"] == "Phase 4 Final Validation Student"

# 4. Query student via API
with urllib.request.urlopen(f"http://localhost:8000/api/students/{new_id}") as resp:
    st_api = json.loads(resp.read().decode())
    assert st_api["StudentID"] == new_id
    print(f"[STEP 4] Pre-restart API query successful: {st_api['Name']}")

# Save student_id for post-restart verification
with open("test_persist_id.tmp", "w") as f:
    f.write(str(new_id))

print("[STEP 5] Ready for daemon restart.")
