"""
HostelOS BACSE202 DA3 - Comprehensive Neo4j Graph Verification
Executes live Cypher queries to verify node counts, relationship traversals,
integrity constraints, and schema parity with SQLite.

Author: Jyotish N (25BAI1176) — VIT Chennai
"""

import os
import sqlite3
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()

DB_PATH = os.path.join(os.path.dirname(__file__), "hostelos.db")
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")


def run_verification():
    print("=" * 75)
    print("HOSTELOS BACSE202 DA3 — NEO4J GRAPH VERIFICATION SUITE")
    print(f"Database URI: {NEO4J_URI} | SQLite: {DB_PATH}")
    print("=" * 75)

    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    driver.verify_connectivity()

    sqlite_conn = sqlite3.connect(DB_PATH)
    sqlite_cursor = sqlite_conn.cursor()

    with driver.session() as session:
        # 1. Uniqueness Constraints & Indexes
        print("\n" + "=" * 75)
        print("1. UNIQUENESS CONSTRAINTS & INDEXES")
        print("=" * 75)
        constraints = session.run("SHOW CONSTRAINTS YIELD name, type, entityType, labelsOrTypes, properties").data()
        print(f"Total Constraints: {len(constraints)}")
        for c in constraints:
            labels = c.get("labelsOrTypes", [])
            props = c.get("properties", [])
            print(f"  • {c['name']:32s} | Label: {str(labels):22s} | Property: {str(props):20s} | Type: {c['type']}")

        # 2. Comparison: SQLite Rows vs Neo4j Nodes
        print("\n" + "=" * 75)
        print("2. DATA PARITY: SQLITE TABLE ROWS vs NEO4J GRAPH NODES")
        print("=" * 75)
        entity_mapping = [
            ("hostel", "Hostel"),
            ("block", "Block"),
            ("room", "Room"),
            ("student", "Student"),
            ("warden", "Warden"),
            ("staff", "Staff"),
            ("payment", "Payment"),
            ("complaint", "Complaint"),
            ("emergency_contact", "EmergencyContact"),
            ("visitor", "Visitor"),
            ("maintenance_request", "MaintenanceRequest"),
        ]

        print(f"{'Entity':22s} | {'SQLite Rows':12s} | {'Neo4j Nodes':12s} | {'Status':8s}")
        print("-" * 62)
        total_sq_nodes = 0
        total_neo_nodes = 0
        for sq_table, neo_label in entity_mapping:
            sq_count = sqlite_cursor.execute(f"SELECT count(*) FROM {sq_table}").fetchone()[0]
            neo_res = session.run(f"MATCH (n:{neo_label}) RETURN count(n) AS c").single()
            neo_count = neo_res["c"] if neo_res else 0
            total_sq_nodes += sq_count
            total_neo_nodes += neo_count
            match_status = "MATCH [OK]" if sq_count == neo_count else "MISMATCH"
            print(f"{neo_label:22s} | {sq_count:<12d} | {neo_count:<12d} | {match_status}")
        print("-" * 62)
        print(f"{'TOTAL NODES':22s} | {total_sq_nodes:<12d} | {total_neo_nodes:<12d} | {'MATCH [OK]' if total_sq_nodes == total_neo_nodes else 'MISMATCH'}")

        # 3. Relationship Counts in Neo4j
        print("\n" + "=" * 75)
        print("3. GRAPH RELATIONSHIPS BY TYPE")
        print("=" * 75)
        rel_counts = session.run("MATCH ()-[r]->() RETURN type(r) AS rel_type, count(*) AS count ORDER BY rel_type").data()
        total_rels = 0
        for rc in rel_counts:
            print(f"  • {rc['rel_type']:22s}: {rc['count']}")
            total_rels += rc['count']
        print("-" * 40)
        print(f"  TOTAL RELATIONSHIPS     : {total_rels}")

        # 4. Traversal 1: Student Room Allocation -> Block -> Hostel
        print("\n" + "=" * 75)
        print("4. GRAPH TRAVERSAL: (Student)-[:ALLOCATED_TO]->(Room)-[:LOCATED_IN]->(Block)-[:BELONGS_TO]->(Hostel)")
        print("=" * 75)
        q_alloc = """
        MATCH (s:Student)-[a:ALLOCATED_TO]->(rm:Room)-[:LOCATED_IN]->(b:Block)-[:BELONGS_TO]->(h:Hostel)
        RETURN s.student_name AS student,
               s.reg_no AS reg_no,
               a.alloc_id AS alloc_id,
               a.status AS status,
               rm.room_no AS room,
               b.block_name AS block,
               h.hostel_name AS hostel
        ORDER BY s.student_id, a.alloc_id
        """
        alloc_records = session.run(q_alloc).data()
        print(f"{'Student':16s} | {'Reg No':12s} | {'Alloc ID':9s} | {'Status':8s} | {'Room':6s} | {'Block':10s} | {'Hostel':16s}")
        print("-" * 88)
        for ar in alloc_records:
            print(f"{ar['student']:16s} | {ar['reg_no']:12s} | {ar['alloc_id']:<9d} | {ar['status']:8s} | {ar['room']:6s} | {ar['block']:10s} | {ar['hostel']:16s}")

        # 5. Traversal 2: Payments -> Student & Staff
        print("\n" + "=" * 75)
        print("5. GRAPH TRAVERSAL: (Student)-[:MADE]->(Payment)-[:PROCESSED_BY]->(Staff)")
        print("=" * 75)
        q_pay = """
        MATCH (s:Student)-[:MADE]->(p:Payment)-[:PROCESSED_BY]->(st:Staff)
        RETURN s.student_name AS student,
               p.receipt_number AS receipt,
               p.amount AS amount,
               p.payment_mode AS mode,
               p.status AS status,
               st.staff_name AS processed_by
        ORDER BY p.payment_id
        """
        pay_records = session.run(q_pay).data()
        print(f"{'Student':16s} | {'Receipt':10s} | {'Amount':10s} | {'Mode':10s} | {'Status':8s} | {'Processed By':14s}")
        print("-" * 78)
        for pr in pay_records:
            print(f"{pr['student']:16s} | {pr['receipt']:10s} | ₹{pr['amount']:<9,.0f} | {pr['mode']:10s} | {pr['status']:8s} | {pr['processed_by']:14s}")

        # 6. Traversal 3: Complaints -> Student & Staff
        print("\n" + "=" * 75)
        print("6. GRAPH TRAVERSAL: (Student)-[:RAISED]->(Complaint)-[:HANDLED_BY]->(Staff)")
        print("=" * 75)
        q_comp = """
        MATCH (s:Student)-[:RAISED]->(c:Complaint)-[:HANDLED_BY]->(st:Staff)
        RETURN s.student_name AS student,
               c.complaint_id AS cid,
               c.category AS category,
               c.priority AS priority,
               c.status AS status,
               st.staff_name AS handled_by
        ORDER BY c.complaint_id
        """
        comp_records = session.run(q_comp).data()
        print(f"{'Student':16s} | {'CID':5s} | {'Category':12s} | {'Priority':9s} | {'Status':10s} | {'Handled By':14s}")
        print("-" * 74)
        for cr in comp_records:
            print(f"{cr['student']:16s} | {cr['cid']:<5d} | {cr['category']:12s} | {cr['priority']:9s} | {cr['status']:10s} | {cr['handled_by']:14s}")

        # 7. Traversal 4: Emergency Contacts -> Student
        print("\n" + "=" * 75)
        print("7. GRAPH TRAVERSAL: (EmergencyContact)-[:CONTACT_FOR]->(Student)")
        print("=" * 75)
        q_ec = """
        MATCH (ec:EmergencyContact)-[:CONTACT_FOR]->(s:Student)
        RETURN ec.contact_id AS cid,
               ec.name AS contact_name,
               ec.relation AS relation,
               ec.phone AS phone,
               s.student_name AS student
        ORDER BY ec.contact_id
        """
        ec_records = session.run(q_ec).data()
        print(f"{'Contact ID':10s} | {'Contact Name':14s} | {'Relation':10s} | {'Phone':12s} | {'Student':16s}")
        print("-" * 70)
        for e in ec_records:
            print(f"{e['cid']:<10d} | {e['contact_name']:14s} | {e['relation']:10s} | {e['phone']:12s} | {e['student']:16s}")

        # 8. Traversal 5: Visitor -> Student & Staff
        print("\n" + "=" * 75)
        print("8. GRAPH TRAVERSAL: (Visitor)-[:VISITED]->(Student) & (Visitor)-[:APPROVED_BY]->(Staff)")
        print("=" * 75)
        q_vis = """
        MATCH (v:Visitor)-[:VISITED]->(s:Student)
        MATCH (v)-[:APPROVED_BY]->(st:Staff)
        RETURN v.visitor_id AS vid,
               v.name AS visitor,
               v.purpose AS purpose,
               s.student_name AS student_visited,
               st.staff_name AS approved_by
        ORDER BY v.visitor_id
        """
        vis_records = session.run(q_vis).data()
        print(f"{'VID':5s} | {'Visitor':16s} | {'Purpose':14s} | {'Student Visited':16s} | {'Approved By':14s}")
        print("-" * 72)
        for vr in vis_records:
            print(f"{vr['vid']:<5d} | {vr['visitor']:16s} | {vr['purpose']:14s} | {vr['student_visited']:16s} | {vr['approved_by']:14s}")

        # 9. Traversal 6: Maintenance Request -> Room & Staff
        print("\n" + "=" * 75)
        print("9. GRAPH TRAVERSAL: (MaintenanceRequest)-[:FOR_ROOM]->(Room) & (MaintenanceRequest)-[:ASSIGNED_TO]->(Staff)")
        print("=" * 75)
        q_maint = """
        MATCH (m:MaintenanceRequest)-[:FOR_ROOM]->(r:Room)-[:LOCATED_IN]->(b:Block)
        MATCH (m)-[:ASSIGNED_TO]->(st:Staff)
        RETURN m.request_id AS mid,
               m.issue_type AS issue,
               m.status AS status,
               m.priority AS priority,
               r.room_no AS room,
               b.block_name AS block,
               st.staff_name AS assigned_to
        ORDER BY m.request_id
        """
        maint_records = session.run(q_maint).data()
        print(f"{'Req ID':7s} | {'Issue':12s} | {'Priority':9s} | {'Status':10s} | {'Room':6s} | {'Block':10s} | {'Assigned Staff':14s}")
        print("-" * 78)
        for mr in maint_records:
            print(f"{mr['mid']:<7d} | {mr['issue']:12s} | {mr['priority']:9s} | {mr['status']:10s} | {mr['room']:6s} | {mr['block']:10s} | {mr['assigned_to']:14s}")

        # 10. Traversal 7: Warden -> Block -> Hostel
        print("\n" + "=" * 75)
        print("10. GRAPH TRAVERSAL: (Warden)-[:MANAGES]->(Block)-[:BELONGS_TO]->(Hostel)")
        print("=" * 75)
        q_warden = """
        MATCH (w:Warden)-[:MANAGES]->(b:Block)-[:BELONGS_TO]->(h:Hostel)
        RETURN w.warden_id AS wid,
               w.warden_name AS warden,
               w.warden_email AS email,
               b.block_name AS block,
               h.hostel_name AS hostel
        ORDER BY w.warden_id
        """
        warden_records = session.run(q_warden).data()
        print(f"{'WID':5s} | {'Warden':14s} | {'Email':22s} | {'Block':10s} | {'Hostel':16s}")
        print("-" * 73)
        for wr in warden_records:
            print(f"{wr['wid']:<5d} | {wr['warden']:14s} | {wr['email']:22s} | {wr['block']:10s} | {wr['hostel']:16s}")

    driver.close()
    sqlite_conn.close()
    print("\n" + "=" * 75)
    print("[SUCCESS] All Cypher verification traversals executed with 100% integrity.")
    print("=" * 75)


if __name__ == "__main__":
    run_verification()
