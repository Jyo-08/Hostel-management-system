"""
HostelOS BACSE202 DA3 - Native Neo4j Schema Setup
Idempotent script to create uniqueness constraints and property indexes.
Author: Jyotish N (25BAI1176) — VIT Chennai
"""

import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")

CONSTRAINTS = [
    # 1. Student
    ("constraint_student_id", "CREATE CONSTRAINT constraint_student_id IF NOT EXISTS FOR (s:Student) REQUIRE s.student_id IS UNIQUE"),
    # 2. Hostel
    ("constraint_hostel_id", "CREATE CONSTRAINT constraint_hostel_id IF NOT EXISTS FOR (h:Hostel) REQUIRE h.hostel_id IS UNIQUE"),
    # 3. Block
    ("constraint_block_id", "CREATE CONSTRAINT constraint_block_id IF NOT EXISTS FOR (b:Block) REQUIRE b.block_id IS UNIQUE"),
    # 4. Room
    ("constraint_room_id", "CREATE CONSTRAINT constraint_room_id IF NOT EXISTS FOR (r:Room) REQUIRE r.room_id IS UNIQUE"),
    # 5. Warden
    ("constraint_warden_id", "CREATE CONSTRAINT constraint_warden_id IF NOT EXISTS FOR (w:Warden) REQUIRE w.warden_id IS UNIQUE"),
    # 6. Staff
    ("constraint_staff_id", "CREATE CONSTRAINT constraint_staff_id IF NOT EXISTS FOR (st:Staff) REQUIRE st.staff_id IS UNIQUE"),
    # 7. Payment
    ("constraint_payment_id", "CREATE CONSTRAINT constraint_payment_id IF NOT EXISTS FOR (p:Payment) REQUIRE p.payment_id IS UNIQUE"),
    # 8. Complaint
    ("constraint_complaint_id", "CREATE CONSTRAINT constraint_complaint_id IF NOT EXISTS FOR (c:Complaint) REQUIRE c.complaint_id IS UNIQUE"),
    # 9. EmergencyContact
    ("constraint_emergency_contact_id", "CREATE CONSTRAINT constraint_emergency_contact_id IF NOT EXISTS FOR (ec:EmergencyContact) REQUIRE ec.contact_id IS UNIQUE"),
    # 10. Visitor
    ("constraint_visitor_id", "CREATE CONSTRAINT constraint_visitor_id IF NOT EXISTS FOR (v:Visitor) REQUIRE v.visitor_id IS UNIQUE"),
    # 11. MaintenanceRequest
    ("constraint_maintenance_id", "CREATE CONSTRAINT constraint_maintenance_id IF NOT EXISTS FOR (m:MaintenanceRequest) REQUIRE m.request_id IS UNIQUE"),
]

INDEXES = [
    ("index_student_reg_no", "CREATE INDEX index_student_reg_no IF NOT EXISTS FOR (s:Student) ON (s.reg_no)"),
    ("index_room_no", "CREATE INDEX index_room_no IF NOT EXISTS FOR (r:Room) ON (r.room_no)"),
    ("index_payment_receipt", "CREATE INDEX index_payment_receipt IF NOT EXISTS FOR (p:Payment) ON (p.receipt_number)"),
    ("index_hostel_name", "CREATE INDEX index_hostel_name IF NOT EXISTS FOR (h:Hostel) ON (h.hostel_name)"),
]

def setup_schema():
    print("=" * 65)
    print("HOSTELOS NEO4J SCHEMA & CONSTRAINTS SETUP (BACSE202 DA3)")
    print("=" * 65)

    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    driver.verify_connectivity()

    with driver.session() as session:
        print("\n--- Applying Uniqueness Constraints ---")
        for name, query in CONSTRAINTS:
            try:
                session.run(query)
                print(f"[OK] {name}")
            except Exception as e:
                print(f"[ERROR] Failed {name}: {e}")

        print("\n--- Applying Performance Indexes ---")
        for name, query in INDEXES:
            try:
                session.run(query)
                print(f"[OK] {name}")
            except Exception as e:
                print(f"[ERROR] Failed {name}: {e}")

        # Show active constraints in database
        print("\n--- Active Database Constraints ---")
        constraints = session.run("SHOW CONSTRAINTS YIELD name, type, entityType, labelsOrTypes, properties").data()
        for c in constraints:
            labels = c.get('labelsOrTypes', [])
            props = c.get('properties', [])
            print(f" • {c.get('name')}: {labels} -> {props} ({c.get('type')})")

        print("\n--- Active Database Indexes ---")
        indexes = session.run("SHOW INDEXES YIELD name, type, entityType, labelsOrTypes, properties").data()
        for idx in indexes:
            if idx.get('type') != 'LOOKUP':
                labels = idx.get('labelsOrTypes', [])
                props = idx.get('properties', [])
                print(f" • {idx.get('name')}: {labels} -> {props} ({idx.get('type')})")

    driver.close()
    print("\n" + "=" * 65)
    print("[SUCCESS] Neo4j graph schema setup completed idempotently.")
    print("=" * 65)

if __name__ == "__main__":
    setup_schema()
