"""
HostelOS BACSE202 DA3 - Native Neo4j Data Seeder
Imports all authoritative records and foreign-key relationships from SQLite into Neo4j.
Idempotent: Safe to execute repeatedly without duplicating nodes or relationships.

Author: Jyotish N (25BAI1176) — VIT Chennai
"""

import os
import sys
import sqlite3
from typing import Dict, Any, List, Tuple
from dotenv import load_dotenv
from neo4j import GraphDatabase

# Load configuration
load_dotenv()

DB_PATH = os.path.join(os.path.dirname(__file__), "hostelos.db")
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")


class Neo4jSeeder:
    def __init__(self, db_path: str, uri: str, user: str, password: str):
        self.db_path = db_path
        self.uri = uri
        self.user = user
        self.password = password
        self.driver = None
        self.sqlite_conn = None
        
        # Tracking metrics
        self.node_counts = {}
        self.rel_counts = {}
        self.missing_references = []
        self.rejected_records = []

    def connect(self):
        if not os.path.exists(self.db_path):
            raise FileNotFoundError(f"SQLite database not found at {self.db_path}")
        self.sqlite_conn = sqlite3.connect(self.db_path)
        self.sqlite_conn.row_factory = sqlite3.Row

        self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
        self.driver.verify_connectivity()
        print(f"[OK] Connected to SQLite ({self.db_path}) and Neo4j ({self.uri})")

    def close(self):
        if self.sqlite_conn:
            self.sqlite_conn.close()
        if self.driver:
            self.driver.close()

    def _get_sqlite_rows(self, table_name: str) -> List[Dict[str, Any]]:
        cursor = self.sqlite_conn.cursor()
        cursor.execute(f"SELECT * FROM {table_name}")
        return [dict(row) for row in cursor.fetchall()]

    def seed_nodes(self, session):
        print("\n" + "=" * 60)
        print("STAGE 1: SEEDING GRAPH NODES (MERGE ON UNIQUE IDENTIFIERS)")
        print("=" * 60)

        # 1. Hostels
        hostels = self._get_sqlite_rows("hostel")
        for h in hostels:
            query = """
            MERGE (n:Hostel {hostel_id: $hostel_id})
            SET n.hostel_name = $hostel_name,
                n.type = $type,
                n.address = $address,
                n.capacity = $capacity
            RETURN n.hostel_id AS id
            """
            session.run(query, h)
        self.node_counts["Hostel"] = len(hostels)
        print(f"  [Node] Hostel: {len(hostels)} records merged")

        # 2. Blocks
        blocks = self._get_sqlite_rows("block")
        for b in blocks:
            query = """
            MERGE (n:Block {block_id: $block_id})
            SET n.block_name = $block_name,
                n.floor = $floor,
                n.hostel_id = $hostel_id
            RETURN n.block_id AS id
            """
            session.run(query, b)
        self.node_counts["Block"] = len(blocks)
        print(f"  [Node] Block: {len(blocks)} records merged")

        # 3. Rooms
        rooms = self._get_sqlite_rows("room")
        for r in rooms:
            query = """
            MERGE (n:Room {room_id: $room_id})
            SET n.room_no = $room_no,
                n.type = $type,
                n.floor_no = $floor_no,
                n.status = $status,
                n.block_id = $block_id,
                n.capacity = $capacity,
                n.current_occupancy = $current_occupancy
            RETURN n.room_id AS id
            """
            session.run(query, r)
        self.node_counts["Room"] = len(rooms)
        print(f"  [Node] Room: {len(rooms)} records merged")

        # 4. Wardens
        wardens = self._get_sqlite_rows("warden")
        for w in wardens:
            query = """
            MERGE (n:Warden {warden_id: $warden_id})
            SET n.warden_name = $warden_name,
                n.warden_email = $warden_email,
                n.warden_phone = $warden_phone,
                n.block_id = $block_id
            RETURN n.warden_id AS id
            """
            session.run(query, w)
        self.node_counts["Warden"] = len(wardens)
        print(f"  [Node] Warden: {len(wardens)} records merged")

        # 5. Staff
        staff_members = self._get_sqlite_rows("staff")
        for s in staff_members:
            query = """
            MERGE (n:Staff {staff_id: $staff_id})
            SET n.staff_name = $staff_name,
                n.staff_designation = $staff_designation,
                n.staff_gender = $staff_gender,
                n.join_date = $join_date,
                n.hostel_id = $hostel_id
            RETURN n.staff_id AS id
            """
            session.run(query, s)
        self.node_counts["Staff"] = len(staff_members)
        print(f"  [Node] Staff: {len(staff_members)} records merged")

        # 6. Students
        students = self._get_sqlite_rows("student")
        for st in students:
            query = """
            MERGE (n:Student {student_id: $student_id})
            SET n.student_name = $student_name,
                n.gender = $gender,
                n.dob = $dob,
                n.course = $course,
                n.year = $year,
                n.phone = $phone,
                n.reg_no = $reg_no,
                n.email = $email
            RETURN n.student_id AS id
            """
            session.run(query, st)
        self.node_counts["Student"] = len(students)
        print(f"  [Node] Student: {len(students)} records merged")

        # 7. Payments
        payments = self._get_sqlite_rows("payment")
        for p in payments:
            query = """
            MERGE (n:Payment {payment_id: $payment_id})
            SET n.amount = $amount,
                n.payment_mode = $payment_mode,
                n.pay_date = $pay_date,
                n.status = $status,
                n.staff_id = $staff_id,
                n.student_id = $student_id,
                n.receipt_number = $receipt_number,
                n.payment_type = $payment_type
            RETURN n.payment_id AS id
            """
            session.run(query, p)
        self.node_counts["Payment"] = len(payments)
        print(f"  [Node] Payment: {len(payments)} records merged")

        # 8. Complaints
        complaints = self._get_sqlite_rows("complaint")
        for c in complaints:
            query = """
            MERGE (n:Complaint {complaint_id: $complaint_id})
            SET n.category = $category,
                n.description = $description,
                n.status = $status,
                n.raised_date = $raised_date,
                n.student_id = $student_id,
                n.priority = $priority,
                n.handled_by = $handled_by
            RETURN n.complaint_id AS id
            """
            session.run(query, c)
        self.node_counts["Complaint"] = len(complaints)
        print(f"  [Node] Complaint: {len(complaints)} records merged")

        # 9. Emergency Contacts
        contacts = self._get_sqlite_rows("emergency_contact")
        for ec in contacts:
            query = """
            MERGE (n:EmergencyContact {contact_id: $contact_id})
            SET n.name = $name,
                n.phone = $phone,
                n.relation = $relation,
                n.student_id = $student_id
            RETURN n.contact_id AS id
            """
            session.run(query, ec)
        self.node_counts["EmergencyContact"] = len(contacts)
        print(f"  [Node] EmergencyContact: {len(contacts)} records merged")

        # 10. Visitors
        visitors = self._get_sqlite_rows("visitor")
        for v in visitors:
            query = """
            MERGE (n:Visitor {visitor_id: $visitor_id})
            SET n.name = $name,
                n.id_proof = $id_proof,
                n.visit_time = $visit_time,
                n.purpose = $purpose,
                n.student_id = $student_id,
                n.approved_by = $approved_by
            RETURN n.visitor_id AS id
            """
            session.run(query, v)
        self.node_counts["Visitor"] = len(visitors)
        print(f"  [Node] Visitor: {len(visitors)} records merged")

        # 11. Maintenance Requests
        maintenance = self._get_sqlite_rows("maintenance_request")
        for m in maintenance:
            query = """
            MERGE (n:MaintenanceRequest {request_id: $request_id})
            SET n.issue_type = $issue_type,
                n.description = $description,
                n.status = $status,
                n.raised_date = $raised_date,
                n.room_id = $room_id,
                n.priority = $priority,
                n.assigned_staff = $assigned_staff
            RETURN n.request_id AS id
            """
            session.run(query, m)
        self.node_counts["MaintenanceRequest"] = len(maintenance)
        print(f"  [Node] MaintenanceRequest: {len(maintenance)} records merged")

    def seed_relationships(self, session):
        print("\n" + "=" * 60)
        print("STAGE 2: SEEDING GRAPH RELATIONSHIPS (FOREIGN KEY TRAVERSALS)")
        print("=" * 60)

        # Helper to run relationship merge and verify both ends exist
        def create_rel(rel_name: str, match_cypher: str, params: Dict[str, Any], context: str) -> bool:
            res = session.run(match_cypher, params).data()
            if not res:
                self.missing_references.append({
                    "relationship": rel_name,
                    "params": params,
                    "reason": f"Source or target node not found in graph for {context}"
                })
                return False
            self.rel_counts[rel_name] = self.rel_counts.get(rel_name, 0) + 1
            return True

        # 1. Block -> Hostel: BELONGS_TO
        blocks = self._get_sqlite_rows("block")
        for b in blocks:
            cypher = """
            MATCH (b:Block {block_id: $block_id})
            MATCH (h:Hostel {hostel_id: $hostel_id})
            MERGE (b)-[r:BELONGS_TO]->(h)
            RETURN elementId(r) AS rel_id
            """
            create_rel("BELONGS_TO", cypher, {"block_id": b["block_id"], "hostel_id": b["hostel_id"]}, f"Block {b['block_id']} -> Hostel {b['hostel_id']}")
        print(f"  [Rel] (Block)-[:BELONGS_TO]->(Hostel): {self.rel_counts.get('BELONGS_TO', 0)}")

        # 2. Room -> Block: LOCATED_IN
        rooms = self._get_sqlite_rows("room")
        for r in rooms:
            cypher = """
            MATCH (r:Room {room_id: $room_id})
            MATCH (b:Block {block_id: $block_id})
            MERGE (r)-[rel:LOCATED_IN]->(b)
            RETURN elementId(rel) AS rel_id
            """
            create_rel("LOCATED_IN", cypher, {"room_id": r["room_id"], "block_id": r["block_id"]}, f"Room {r['room_id']} -> Block {r['block_id']}")
        print(f"  [Rel] (Room)-[:LOCATED_IN]->(Block): {self.rel_counts.get('LOCATED_IN', 0)}")

        # 3. Warden -> Block: MANAGES
        wardens = self._get_sqlite_rows("warden")
        for w in wardens:
            if w.get("block_id"):
                cypher = """
                MATCH (w:Warden {warden_id: $warden_id})
                MATCH (b:Block {block_id: $block_id})
                MERGE (w)-[rel:MANAGES]->(b)
                RETURN elementId(rel) AS rel_id
                """
                create_rel("MANAGES", cypher, {"warden_id": w["warden_id"], "block_id": w["block_id"]}, f"Warden {w['warden_id']} -> Block {w['block_id']}")
        print(f"  [Rel] (Warden)-[:MANAGES]->(Block): {self.rel_counts.get('MANAGES', 0)}")

        # 4. Staff -> Hostel: ASSIGNED_TO
        staff_members = self._get_sqlite_rows("staff")
        for s in staff_members:
            if s.get("hostel_id"):
                cypher = """
                MATCH (st:Staff {staff_id: $staff_id})
                MATCH (h:Hostel {hostel_id: $hostel_id})
                MERGE (st)-[rel:ASSIGNED_TO]->(h)
                RETURN elementId(rel) AS rel_id
                """
                create_rel("ASSIGNED_TO", cypher, {"staff_id": s["staff_id"], "hostel_id": s["hostel_id"]}, f"Staff {s['staff_id']} -> Hostel {s['hostel_id']}")
        staff_assigned = self.rel_counts.get("ASSIGNED_TO", 0)
        print(f"  [Rel] (Staff)-[:ASSIGNED_TO]->(Hostel): {staff_assigned}")

        # 5. Student -> Room: ALLOCATED_TO (with alloc_id, date_from, date_to, status properties)
        allocations = self._get_sqlite_rows("room_allocation")
        for a in allocations:
            cypher = """
            MATCH (st:Student {student_id: $student_id})
            MATCH (r:Room {room_id: $room_id})
            MERGE (st)-[rel:ALLOCATED_TO {alloc_id: $alloc_id}]->(r)
            SET rel.date_from = $date_from,
                rel.date_to = $date_to,
                rel.status = $status
            RETURN elementId(rel) AS rel_id
            """
            create_rel("ALLOCATED_TO", cypher, {
                "student_id": a["student_id"],
                "room_id": a["room_id"],
                "alloc_id": a["alloc_id"],
                "date_from": a["date_from"],
                "date_to": a["date_to"],
                "status": a["status"]
            }, f"Allocation {a['alloc_id']}: Student {a['student_id']} -> Room {a['room_id']}")
        print(f"  [Rel] (Student)-[:ALLOCATED_TO]->(Room): {self.rel_counts.get('ALLOCATED_TO', 0)}")

        # 6. Student -> Payment: MADE
        payments = self._get_sqlite_rows("payment")
        for p in payments:
            cypher = """
            MATCH (st:Student {student_id: $student_id})
            MATCH (p:Payment {payment_id: $payment_id})
            MERGE (st)-[rel:MADE]->(p)
            RETURN elementId(rel) AS rel_id
            """
            create_rel("MADE", cypher, {"student_id": p["student_id"], "payment_id": p["payment_id"]}, f"Student {p['student_id']} -> Payment {p['payment_id']}")

            # Payment -> Staff: PROCESSED_BY
            if p.get("staff_id"):
                cypher_staff = """
                MATCH (p:Payment {payment_id: $payment_id})
                MATCH (st:Staff {staff_id: $staff_id})
                MERGE (p)-[rel:PROCESSED_BY]->(st)
                RETURN elementId(rel) AS rel_id
                """
                create_rel("PROCESSED_BY", cypher_staff, {"payment_id": p["payment_id"], "staff_id": p["staff_id"]}, f"Payment {p['payment_id']} -> Staff {p['staff_id']}")
        print(f"  [Rel] (Student)-[:MADE]->(Payment): {self.rel_counts.get('MADE', 0)}")
        print(f"  [Rel] (Payment)-[:PROCESSED_BY]->(Staff): {self.rel_counts.get('PROCESSED_BY', 0)}")

        # 7. Student -> Complaint: RAISED
        complaints = self._get_sqlite_rows("complaint")
        for c in complaints:
            cypher = """
            MATCH (st:Student {student_id: $student_id})
            MATCH (c:Complaint {complaint_id: $complaint_id})
            MERGE (st)-[rel:RAISED]->(c)
            RETURN elementId(rel) AS rel_id
            """
            create_rel("RAISED", cypher, {"student_id": c["student_id"], "complaint_id": c["complaint_id"]}, f"Student {c['student_id']} -> Complaint {c['complaint_id']}")

            # Complaint -> Staff: HANDLED_BY
            if c.get("handled_by"):
                cypher_handled = """
                MATCH (c:Complaint {complaint_id: $complaint_id})
                MATCH (st:Staff {staff_id: $handled_by})
                MERGE (c)-[rel:HANDLED_BY]->(st)
                RETURN elementId(rel) AS rel_id
                """
                create_rel("HANDLED_BY", cypher_handled, {"complaint_id": c["complaint_id"], "handled_by": c["handled_by"]}, f"Complaint {c['complaint_id']} -> Staff {c['handled_by']}")
        print(f"  [Rel] (Student)-[:RAISED]->(Complaint): {self.rel_counts.get('RAISED', 0)}")
        print(f"  [Rel] (Complaint)-[:HANDLED_BY]->(Staff): {self.rel_counts.get('HANDLED_BY', 0)}")

        # 8. EmergencyContact -> Student: CONTACT_FOR
        contacts = self._get_sqlite_rows("emergency_contact")
        for ec in contacts:
            cypher = """
            MATCH (ec:EmergencyContact {contact_id: $contact_id})
            MATCH (st:Student {student_id: $student_id})
            MERGE (ec)-[rel:CONTACT_FOR]->(st)
            RETURN elementId(rel) AS rel_id
            """
            create_rel("CONTACT_FOR", cypher, {"contact_id": ec["contact_id"], "student_id": ec["student_id"]}, f"Contact {ec['contact_id']} -> Student {ec['student_id']}")
        print(f"  [Rel] (EmergencyContact)-[:CONTACT_FOR]->(Student): {self.rel_counts.get('CONTACT_FOR', 0)}")

        # 9. Visitor -> Student: VISITED & Visitor -> Staff: APPROVED_BY
        visitors = self._get_sqlite_rows("visitor")
        for v in visitors:
            cypher = """
            MATCH (v:Visitor {visitor_id: $visitor_id})
            MATCH (st:Student {student_id: $student_id})
            MERGE (v)-[rel:VISITED]->(st)
            RETURN elementId(rel) AS rel_id
            """
            create_rel("VISITED", cypher, {"visitor_id": v["visitor_id"], "student_id": v["student_id"]}, f"Visitor {v['visitor_id']} -> Student {v['student_id']}")

            if v.get("approved_by"):
                cypher_app = """
                MATCH (v:Visitor {visitor_id: $visitor_id})
                MATCH (st:Staff {staff_id: $approved_by})
                MERGE (v)-[rel:APPROVED_BY]->(st)
                RETURN elementId(rel) AS rel_id
                """
                create_rel("APPROVED_BY", cypher_app, {"visitor_id": v["visitor_id"], "approved_by": v["approved_by"]}, f"Visitor {v['visitor_id']} -> Staff {v['approved_by']}")
        print(f"  [Rel] (Visitor)-[:VISITED]->(Student): {self.rel_counts.get('VISITED', 0)}")
        print(f"  [Rel] (Visitor)-[:APPROVED_BY]->(Staff): {self.rel_counts.get('APPROVED_BY', 0)}")

        # 10. MaintenanceRequest -> Room: FOR_ROOM & MaintenanceRequest -> Staff: ASSIGNED_TO
        maintenance = self._get_sqlite_rows("maintenance_request")
        for m in maintenance:
            cypher = """
            MATCH (m:MaintenanceRequest {request_id: $request_id})
            MATCH (r:Room {room_id: $room_id})
            MERGE (m)-[rel:FOR_ROOM]->(r)
            RETURN elementId(rel) AS rel_id
            """
            create_rel("FOR_ROOM", cypher, {"request_id": m["request_id"], "room_id": m["room_id"]}, f"Maintenance {m['request_id']} -> Room {m['room_id']}")

            if m.get("assigned_staff"):
                cypher_staff = """
                MATCH (m:MaintenanceRequest {request_id: $request_id})
                MATCH (st:Staff {staff_id: $assigned_staff})
                MERGE (m)-[rel:ASSIGNED_TO]->(st)
                RETURN elementId(rel) AS rel_id
                """
                create_rel("ASSIGNED_TO", cypher_staff, {"request_id": m["request_id"], "assigned_staff": m["assigned_staff"]}, f"Maintenance {m['request_id']} -> Staff {m['assigned_staff']}")
        print(f"  [Rel] (MaintenanceRequest)-[:FOR_ROOM]->(Room): {self.rel_counts.get('FOR_ROOM', 0)}")
        total_assigned_to = self.rel_counts.get("ASSIGNED_TO", 0)
        print(f"  [Rel] Total [:ASSIGNED_TO] relationships (Staff->Hostel + Maintenance->Staff): {total_assigned_to}")

    def run(self):
        self.connect()
        print("\n" + "=" * 60)
        print("STARTING NEO4J GRAPH SEEDING TRANSACTION")
        print("=" * 60)

        with self.driver.session() as session:
            # Seed all nodes
            self.seed_nodes(session)
            # Seed all relationships
            self.seed_relationships(session)

            # Query real totals directly from Neo4j
            print("\n" + "=" * 60)
            print("STAGE 3: VERIFYING ACTUAL NEO4J GRAPH COUNTS VIA CYPHER")
            print("=" * 60)

            node_records = session.run("MATCH (n) RETURN head(labels(n)) AS label, count(*) AS count ORDER BY label").data()
            total_nodes = 0
            print("  --- Real Neo4j Node Counts by Label ---")
            for nr in node_records:
                print(f"   • {nr['label']:20s}: {nr['count']}")
                total_nodes += nr['count']
            print(f"   TOTAL NODES IN GRAPH: {total_nodes}")

            rel_records = session.run("MATCH ()-[r]->() RETURN type(r) AS rel_type, count(*) AS count ORDER BY rel_type").data()
            total_rels = 0
            print("\n  --- Real Neo4j Relationship Counts by Type ---")
            for rr in rel_records:
                print(f"   • {rr['rel_type']:20s}: {rr['count']}")
                total_rels += rr['count']
            print(f"   TOTAL RELATIONSHIPS IN GRAPH: {total_rels}")

        # Summary of missing or rejected records
        print("\n" + "=" * 60)
        print("STAGE 4: DATA INTEGRITY & AUDIT REPORT")
        print("=" * 60)
        if self.missing_references:
            print(f"  [WARNING] Found {len(self.missing_references)} missing references during relationship resolution:")
            for mr in self.missing_references:
                print(f"   - {mr}")
        else:
            print("  [OK] Zero missing foreign key references. All source and target entities matched perfectly!")

        if self.rejected_records:
            print(f"  [WARNING] Found {len(self.rejected_records)} rejected records:")
            for rr in self.rejected_records:
                print(f"   - {rr}")
        else:
            print("  [OK] Zero rejected records. All SQLite rows successfully parsed and merged.")

        self.close()
        print("\n[COMPLETE] Neo4j seeding script executed successfully.")


if __name__ == "__main__":
    seeder = Neo4jSeeder(DB_PATH, NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
    seeder.run()
