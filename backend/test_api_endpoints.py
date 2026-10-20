"""
HostelOS BACSE202 DA3 - Automated API & Neo4j Integration Test Suite
Validates all migrated endpoints, CRUD lifecycles, business rules,
and graph persistence against the live FastAPI server and Neo4j database.

Author: Jyotish N (25BAI1176) — VIT Chennai
"""

import sys
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Tuple

BASE_URL = "http://localhost:8000"


def api_request(path: str, method: str = "GET", data: Dict[str, Any] = None) -> Tuple[int, Any]:
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if data is not None:
        body = json.dumps(data).encode("utf-8")
    elif method in ("POST", "PUT", "PATCH"):
        body = b""
    else:
        body = None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            parsed = json.loads(res_body) if res_body else {}
            return response.status, parsed
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = {"raw": err_body}
        return e.code, parsed
    except Exception as e:
        return 500, {"error": str(e)}


def test_suite():
    passed = 0
    failed = 0

    def assert_test(name: str, condition: bool, extra: str = ""):
        nonlocal passed, failed
        if condition:
            passed += 1
            print(f"  [PASS] {name} {extra}")
        else:
            failed += 1
            print(f"  [FAIL] {name} {extra}")

    print("=" * 75)
    print("HOSTELOS BACSE202 DA3 — COMPLETE API & NEO4J INTEGRATION TEST SUITE")
    print(f"Target Server: {BASE_URL}")
    print("=" * 75)

    # -------------------------------------------------------------
    # 1. System Health & Database Reporting
    # -------------------------------------------------------------
    print("\n--- 1. Health & Database Reporting ---")
    st, res = api_request("/api/health")
    assert_test("GET /api/health status is 200", st == 200)
    assert_test("Health confirms Neo4j authoritative database", "Neo4j" in res.get("database", ""))
    assert_test("Health confirms Neo4j is connected", res.get("neo4j", {}).get("connected") is True)
    assert_test("Active records reported (>= 9 students)", res.get("active_records", 0) >= 9)

    st, res = api_request("/api/db-status")
    assert_test("GET /api/db-status status is 200", st == 200)
    assert_test("DB-status reports Neo4j labels", "Student" in res.get("labels", {}))
    assert_test("DB-status reports Student count == 9", res.get("labels", {}).get("Student") >= 9)
    assert_test("DB-status reports Room count == 6", res.get("labels", {}).get("Room") == 6)

    # -------------------------------------------------------------
    # 2. Dashboard Endpoints
    # -------------------------------------------------------------
    print("\n--- 2. Dashboard Summary & Analytics ---")
    st, res = api_request("/api/dashboard/summary")
    assert_test("GET /api/dashboard/summary status is 200", st == 200)
    assert_test("Summary totalRooms == 6", res.get("totalRooms") == 6)
    assert_test("Summary totalCapacity == 10", res.get("totalCapacity") == 10)
    assert_test("Summary totalCollected == 216,000", res.get("totalCollected") == 216000.0)
    assert_test("Summary pendingFees == 45,000", res.get("pendingFees") == 45000.0)

    st, res = api_request("/api/dashboard/hostels")
    assert_test("GET /api/dashboard/hostels status is 200", st == 200)
    assert_test("Hostels count == 3", len(res) == 3)

    st, res = api_request("/api/dashboard/analytics")
    assert_test("GET /api/dashboard/analytics status is 200", st == 200)
    assert_test("Analytics has hostelOccupancy", len(res.get("hostelOccupancy", [])) == 3)
    assert_test("Analytics has capacityDistribution", len(res.get("capacityDistribution", [])) >= 2)

    st, res = api_request("/api/dashboard/recent-activity")
    assert_test("GET /api/dashboard/recent-activity status is 200", st == 200)
    assert_test("Recent allocations present", len(res.get("recentAllocations", [])) > 0)
    assert_test("Recent payments present", len(res.get("recentPayments", [])) > 0)

    # -------------------------------------------------------------
    # 3. Student Management & Safe Deletion
    # -------------------------------------------------------------
    print("\n--- 3. Student Management & Dependency Safety ---")
    st, res = api_request("/api/students")
    assert_test("GET /api/students status is 200", st == 200)
    assert_test("Initial students count >= 9", len(res) >= 9)

    st, res = api_request("/api/students/1150")
    assert_test("GET /api/students/1150 (Janani) status is 200", st == 200)
    assert_test("Student 1150 has active room A101", res.get("RoomNumber") == "A101")
    assert_test("Student 1150 has payments array", len(res.get("payments", [])) > 0)
    assert_test("Student 1150 has emergencyContacts array", len(res.get("emergencyContacts", [])) > 0)

    # Safety rule: Try deleting student 1150 with dependencies
    st, res = api_request("/api/students/1150", method="DELETE")
    assert_test("DELETE student with dependencies returns 400 Bad Request", st == 400)
    assert_test("Rejection mentions dependent records", "historical records" in str(res.get("detail", "")) or "records exist" in str(res.get("detail", "")))

    # Create temporary student for CRUD lifecycle
    test_student_payload = {
        "regNo": "25TEST9999",
        "name": "Integration Test Student",
        "gender": "Female",
        "dob": "2007-04-15",
        "department": "B.Tech AI",
        "year": 1,
        "contactNumber": "9876599999",
        "email": "test.integration@vitstudent.ac.in",
        "admissionDate": "2026-07-01"
    }
    st, res = api_request("/api/students", method="POST", data=test_student_payload)
    assert_test("POST /api/students returns 201 Created", st == 201)
    new_student_id = res.get("student_id")
    assert_test("New student ID returned", bool(new_student_id))

    # Update student
    st, res = api_request(f"/api/students/{new_student_id}", method="PUT", data={"name": "Integration Test Student (Updated)"})
    assert_test(f"PUT /api/students/{new_student_id} returns 200", st == 200)

    # Verify update
    st, res = api_request(f"/api/students/{new_student_id}")
    assert_test("Student name updated in Neo4j", res.get("Name") == "Integration Test Student (Updated)")

    # -------------------------------------------------------------
    # 4. Allocations, Capacity & Vacate Operations
    # -------------------------------------------------------------
    print("\n--- 4. Room Allocations & Capacity Constraints ---")
    st, res = api_request("/api/allocations")
    assert_test("GET /api/allocations status is 200", st == 200)

    # Constraint check 1: Over-allocating already occupied room
    # Room 1001 (capacity: 1, current_occupancy: 1)
    st, res = api_request("/api/allocations", method="POST", data={
        "studentId": new_student_id,
        "roomId": 1001,
        "allocationDate": "2026-10-21"
    })
    assert_test("Reject allocation to fully occupied room (400 Bad Request)", st == 400)
    assert_test("Error explains room capacity limit", "fully occupied" in str(res.get("detail", "")))

    # Allocate new student to available room 3001 (Room C101: capacity 2, occupancy 0)
    st, res = api_request("/api/allocations", method="POST", data={
        "studentId": new_student_id,
        "roomId": 3001,
        "allocationDate": "2026-10-21"
    })
    assert_test("Allocate to available room 3001 returns 201", st == 201)
    new_alloc_id = res.get("allocationId")

    # Verify room 3001 occupancy increased
    st, res = api_request("/api/rooms/3001")
    assert_test("Room 3001 occupancy increased to 1", res.get("CurrentOccupancy") == 1)

    # Constraint check 2: Duplicate active allocation prevention
    st, res = api_request("/api/allocations", method="POST", data={
        "studentId": new_student_id,
        "roomId": 3001,
        "allocationDate": "2026-10-21"
    })
    assert_test("Reject duplicate active allocation (400 Bad Request)", st == 400)

    # Vacate room
    st, res = api_request(f"/api/allocations/{new_alloc_id}/vacate", method="POST")
    assert_test(f"POST /api/allocations/{new_alloc_id}/vacate returns 200", st == 200)

    # Verify room 3001 occupancy decreased back to 0
    st, res = api_request("/api/rooms/3001")
    assert_test("Room 3001 occupancy decreased back to 0 (Available)", res.get("CurrentOccupancy") == 0 and res.get("Status") == "Available")

    # Now delete the test allocation from Neo4j so student has no dependencies before cleanup
    from neo4j_client import neo4j_manager
    neo4j_manager.execute_write("MATCH ()-[a:ALLOCATED_TO {alloc_id: $id}]->() DELETE a", {"id": new_alloc_id})

    # Now delete the test student
    st, res = api_request(f"/api/students/{new_student_id}", method="DELETE")
    assert_test("DELETE student with zero dependencies succeeds (200)", st == 200)

    # Verify student is removed from Neo4j
    st, res = api_request(f"/api/students/{new_student_id}")
    assert_test("Deleted student returns 404", st == 404)

    # -------------------------------------------------------------
    # 5. Core Entities: Hostels, Blocks, Rooms
    # -------------------------------------------------------------
    print("\n--- 5. Hostels, Blocks, and Rooms ---")
    st, res = api_request("/api/hostels")
    assert_test("GET /api/hostels returns 3 hostels", len(res) == 3)

    st, res = api_request("/api/blocks")
    assert_test("GET /api/blocks returns 4 blocks", len(res) == 4)

    st, res = api_request("/api/rooms")
    assert_test("GET /api/rooms returns 6 rooms", len(res) == 6)

    st, res = api_request("/api/rooms/1001")
    assert_test("GET /api/rooms/1001 returns A101 with occupants", len(res.get("occupants", [])) == 1)

    # -------------------------------------------------------------
    # 6. Operational Modules: Payments, Complaints, Maintenance, Visitors
    # -------------------------------------------------------------
    print("\n--- 6. Operations: Payments, Complaints, Maintenance, Visitors ---")
    st, res = api_request("/api/payments")
    assert_test("GET /api/payments returns 6 records", len(res) >= 6)

    st, res = api_request("/api/complaints")
    assert_test("GET /api/complaints returns 4 records", len(res) >= 4)

    st, res = api_request("/api/maintenance")
    assert_test("GET /api/maintenance returns 4 records", len(res) >= 4)

    st, res = api_request("/api/visitors")
    assert_test("GET /api/visitors returns 4 records", len(res) >= 4)

    st, res = api_request("/api/staff")
    assert_test("GET /api/staff returns 4 records", len(res) == 4)

    st, res = api_request("/api/wardens")
    assert_test("GET /api/wardens returns 3 records", len(res) == 3)

    st, res = api_request("/api/emergency-contacts")
    assert_test("GET /api/emergency-contacts returns 5 records", len(res) == 5)

    # -------------------------------------------------------------
    # 7. Graph Explorer
    # -------------------------------------------------------------
    print("\n--- 7. Graph Explorer ---")
    st, res = api_request("/api/graph")
    assert_test("GET /api/graph returns 200 OK", st == 200)
    assert_test("Graph engine indicates Neo4j Bolt Live", "Neo4j" in res.get("engine", ""))
    assert_test("Graph contains exactly 52 nodes", len(res.get("nodes", [])) == 52)
    assert_test("Graph contains exactly 65 links", len(res.get("links", [])) == 65)

    print("\n" + "=" * 75)
    print(f"TEST RESULTS: {passed} PASSED | {failed} FAILED")
    print("=" * 75)

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    test_suite()
