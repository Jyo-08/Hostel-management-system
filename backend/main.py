"""
HostelOS Enterprise FastAPI Backend - Native Neo4j Engine
BACSE202 DA-2 & DA-3 College Hostel Management System
Author: Jyotish N (Reg No: 25BAI1176) — VIT Chennai

Authoritative Database: Neo4j Graph Database (bolt://localhost:7687)
"""

import os
import datetime
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from models import (
    StudentCreate, StudentUpdate,
    HostelCreate, BlockCreate, RoomCreate, RoomUpdate,
    AllocationCreate, PaymentCreate,
    ComplaintCreate, ComplaintStatusUpdate,
    MaintenanceCreate, MaintenanceStatusUpdate,
    VisitorCreate, StaffCreate, WardenCreate,
    EmergencyContactCreate
)
from neo4j_client import neo4j_manager

load_dotenv()

app = FastAPI(
    title="HostelOS Enterprise API",
    description="BACSE202 DA2 & DA3 College Hostel Management System Backend powered by Neo4j Graph Database",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
def shutdown_event():
    neo4j_manager.close()


def cypher_query(query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    try:
        return neo4j_manager.run_query(query, params)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Neo4j Graph Database error: {str(e)}"
        )


def cypher_write(query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    try:
        return neo4j_manager.execute_write(query, params)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Neo4j Graph Database transaction error: {str(e)}"
        )


def update_room_occupancy_status(room_id: int):
    """
    Derives active room occupancy directly from native Neo4j ALLOCATED_TO edges.
    Updates room current_occupancy and status (Available, Partially Occupied, Occupied).
    """
    cypher = """
    MATCH (r:Room {room_id: $room_id})
    OPTIONAL MATCH (:Student)-[a:ALLOCATED_TO {status: 'Active'}]->(r)
    WITH r, count(a) AS active_count
    SET r.current_occupancy = active_count,
        r.status = CASE
            WHEN active_count = 0 THEN 'Available'
            WHEN active_count >= r.capacity THEN 'Occupied'
            ELSE 'Partially Occupied'
        END
    RETURN r.status AS status, r.current_occupancy AS occupancy
    """
    cypher_write(cypher, {"room_id": room_id})


# ==========================================
# 1. SYSTEM HEALTH & DATABASE STATUS
# ==========================================

@app.get("/api/health")
def health_check():
    neo_status = neo4j_manager.check_connection()
    if not neo_status.get("connected"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"status": "offline", "error": "Neo4j database connection failed", "neo4j": neo_status}
        )

    student_res = cypher_query("MATCH (s:Student) RETURN count(s) AS count")
    student_count = student_res[0]["count"] if student_res else 0

    return {
        "status": "online",
        "service": "College Hostel Management System — Digital Assignment 3 (BACSE202)",
        "version": "3.0.0",
        "database": "Neo4j Graph Database (Authoritative Engine)",
        "neo4j": neo_status,
        "active_records": student_count
    }


@app.get("/api/db-status")
def database_status():
    neo_status = neo4j_manager.check_connection()
    if not neo_status.get("connected"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"status": "offline", "error": "Neo4j database connection failed"}
        )

    cypher = """
    MATCH (n)
    RETURN head(labels(n)) AS label, count(n) AS count
    ORDER BY label
    """
    label_records = cypher_query(cypher)
    counts = {r["label"]: r["count"] for r in label_records}

    # Map to table names for backwards compatibility with UI checks
    label_to_table = {
        "Hostel": "hostel",
        "Block": "block",
        "Room": "room",
        "Student": "student",
        "Warden": "warden",
        "Staff": "staff",
        "Payment": "payment",
        "Complaint": "complaint",
        "EmergencyContact": "emergency_contact",
        "Visitor": "visitor",
        "MaintenanceRequest": "maintenance_request"
    }
    table_counts = {}
    for label, count in counts.items():
        tbl = label_to_table.get(label, label.lower())
        table_counts[tbl] = count

    # Include room_allocation count from edges
    alloc_res = cypher_query("MATCH ()-[r:ALLOCATED_TO]->() RETURN count(r) AS count")
    table_counts["room_allocation"] = alloc_res[0]["count"] if alloc_res else 0

    return {
        "status": "connected",
        "project": "College Hostel Management System",
        "author": "Digital Assignment",
        "course": "BACSE202 Database Systems",
        "database_engine": "Neo4j Community 2026 (bolt://localhost:7687)",
        "labels": counts,
        "tables": table_counts,
        "neo4j": neo_status,
        "timestamp": datetime.datetime.now().isoformat()
    }


# ==========================================
# 2. DASHBOARD SUMMARY & ANALYTICS
# ==========================================

@app.get("/api/dashboard/summary")
def get_dashboard_summary():
    # 1. Total students
    s_res = cypher_query("MATCH (s:Student) RETURN count(s) AS total")
    total_students = s_res[0]["total"] if s_res else 0

    # 2. Room statistics
    r_cypher = """
    MATCH (r:Room)
    RETURN count(r) AS total_rooms,
           coalesce(sum(r.capacity), 0) AS total_capacity,
           coalesce(sum(r.current_occupancy), 0) AS occupied_beds
    """
    r_res = cypher_query(r_cypher)
    r_stats = r_res[0] if r_res else {"total_rooms": 0, "total_capacity": 0, "occupied_beds": 0}
    total_rooms = r_stats["total_rooms"]
    total_capacity = r_stats["total_capacity"]
    occupied_beds = r_stats["occupied_beds"]
    available_beds = max(0, total_capacity - occupied_beds)
    occupancy_pct = round((occupied_beds / total_capacity * 100), 1) if total_capacity > 0 else 0.0

    # 3. Payments
    p_cypher = """
    MATCH (p:Payment)
    RETURN coalesce(sum(CASE WHEN p.status = 'Paid' THEN p.amount ELSE 0.0 END), 0.0) AS collected,
           coalesce(sum(CASE WHEN p.status = 'Pending' THEN p.amount ELSE 0.0 END), 0.0) AS pending
    """
    p_res = cypher_query(p_cypher)
    total_collected = p_res[0]["collected"] if p_res else 0.0
    pending_fees = p_res[0]["pending"] if p_res else 0.0

    # 4. Complaints
    c_res = cypher_query("MATCH (c:Complaint {status: 'Pending'}) RETURN count(c) AS open_c")
    open_complaints = c_res[0]["open_c"] if c_res else 0

    # 5. Maintenance
    m_res = cypher_query("MATCH (m:MaintenanceRequest {status: 'Pending'}) RETURN count(m) AS open_m")
    open_maintenance = m_res[0]["open_m"] if m_res else 0

    return {
        "totalStudents": total_students,
        "totalRooms": total_rooms,
        "totalCapacity": total_capacity,
        "occupiedBeds": occupied_beds,
        "availableBeds": available_beds,
        "occupancyPercentage": occupancy_pct,
        "pendingFees": pending_fees,
        "totalCollected": total_collected,
        "openComplaints": open_complaints,
        "openMaintenance": open_maintenance
    }


@app.get("/api/dashboard/hostels")
def get_dashboard_hostels():
    cypher = """
    MATCH (h:Hostel)
    OPTIONAL MATCH (b:Block)-[:BELONGS_TO]->(h)
    OPTIONAL MATCH (r:Room)-[:LOCATED_IN]->(b)
    OPTIONAL MATCH (w:Warden)-[:MANAGES]->(b)
    WITH h,
         count(DISTINCT b) AS block_count,
         count(DISTINCT r) AS room_count,
         coalesce(sum(r.capacity), h.capacity) AS bed_capacity,
         coalesce(sum(r.current_occupancy), 0) AS occupied_beds,
         collect(DISTINCT w) AS wardens
    RETURN h.hostel_id AS hostel_id,
           h.hostel_name AS hostel_name,
           h.type AS type,
           h.capacity AS capacity,
           h.address AS address,
           block_count,
           room_count,
           bed_capacity,
           occupied_beds,
           CASE WHEN size(wardens) > 0 THEN (wardens[0]).warden_name ELSE 'Hostel Office' END AS warden_name,
           CASE WHEN size(wardens) > 0 THEN (wardens[0]).warden_phone ELSE '044-39931555' END AS warden_phone
    ORDER BY h.hostel_id ASC
    """
    rows = cypher_query(cypher)
    hostels = []
    for row in rows:
        bed_cap = row["capacity"]
        occupied = row["occupied_beds"]
        available = max(0, bed_cap - occupied)
        occ_rate = round((occupied / bed_cap * 100), 1) if bed_cap > 0 else 0.0

        hostels.append({
            "hostelId": row["hostel_id"],
            "hostelName": row["hostel_name"],
            "hostelType": row["type"],
            "address": row["address"],
            "wardenName": row["warden_name"],
            "wardenContact": row["warden_phone"],
            "blockCount": row["block_count"],
            "roomCount": row["room_count"],
            "totalCapacity": bed_cap,
            "occupiedBeds": occupied,
            "availableBeds": available,
            "occupancyPercentage": occ_rate
        })

    return hostels


@app.get("/api/dashboard/analytics")
def get_dashboard_analytics():
    # 1. Hostel Occupancy Comparison
    occ_cypher = """
    MATCH (h:Hostel)
    OPTIONAL MATCH (b:Block)-[:BELONGS_TO]->(h)
    OPTIONAL MATCH (r:Room)-[:LOCATED_IN]->(b)
    RETURN h.hostel_id AS hostel_id,
           h.hostel_name AS name,
           coalesce(sum(r.current_occupancy), 0) AS occupied,
           h.capacity AS capacity
    ORDER BY hostel_id ASC
    """
    occ_rows = cypher_query(occ_cypher)
    hostel_occupancy = []
    for r in occ_rows:
        cap = r["capacity"]
        occ = r["occupied"]
        avail = max(0, cap - occ)
        rate = round((occ / cap * 100), 1) if cap > 0 else 0.0
        hostel_occupancy.append({
            "name": r["name"].replace(" Hostel", ""),
            "occupied": occ,
            "available": avail,
            "capacity": cap,
            "rate": rate
        })

    # 2. Capacity distribution by room type
    cap_cypher = """
    MATCH (r:Room)
    RETURN r.type AS type,
           count(r) AS count,
           sum(r.capacity) AS total_beds,
           sum(r.current_occupancy) AS occupied_beds
    ORDER BY r.type
    """
    cap_rows = cypher_query(cap_cypher)
    capacity_distribution = []
    for r in cap_rows:
        total_b = r["total_beds"] or 0
        occ_b = r["occupied_beds"] or 0
        capacity_distribution.append({
            "type": r["type"],
            "rooms": r["count"],
            "totalBeds": total_b,
            "occupiedBeds": occ_b,
            "availableBeds": max(0, total_b - occ_b)
        })

    # 3. Payments by status
    pay_cypher = """
    MATCH (p:Payment)
    RETURN p.status AS status, count(p) AS count, coalesce(sum(p.amount), 0.0) AS amount
    ORDER BY p.status
    """
    pay_rows = cypher_query(pay_cypher)
    payments_by_status = [
        {"status": r["status"], "count": r["count"], "amount": r["amount"]}
        for r in pay_rows
    ]

    # 4. Complaints by category
    comp_cypher = """
    MATCH (c:Complaint)
    RETURN c.category AS category, count(c) AS count
    ORDER BY c.category
    """
    comp_rows = cypher_query(comp_cypher)
    complaints_by_type = [
        {"category": r["category"], "count": r["count"]}
        for r in comp_rows
    ]

    return {
        "hostelOccupancy": hostel_occupancy,
        "capacityDistribution": capacity_distribution,
        "paymentsByStatus": payments_by_status,
        "complaintsByType": complaints_by_type
    }


@app.get("/api/dashboard/recent-activity")
def get_recent_activity():
    # Recent Allocations
    alloc_cypher = """
    MATCH (s:Student)-[ra:ALLOCATED_TO]->(r:Room)
    RETURN ra.alloc_id AS AllocationID,
           ra.date_from AS AllocationDate,
           ra.status AS Status,
           s.student_name AS StudentName,
           s.reg_no AS RegNo,
           r.room_no AS RoomNumber
    ORDER BY ra.alloc_id DESC LIMIT 5
    """
    recent_allocations = cypher_query(alloc_cypher)

    # Latest Payments
    pay_cypher = """
    MATCH (s:Student)-[:MADE]->(p:Payment)
    RETURN p.payment_id AS PaymentID,
           p.amount AS Amount,
           p.pay_date AS PaymentDate,
           p.payment_type AS PaymentType,
           p.status AS Status,
           p.receipt_number AS ReceiptNumber,
           s.student_name AS StudentName,
           s.reg_no AS RegNo
    ORDER BY p.payment_id DESC LIMIT 5
    """
    recent_payments = cypher_query(pay_cypher)

    # Open Complaints
    comp_cypher = """
    MATCH (s:Student)-[:RAISED]->(c:Complaint)
    WHERE c.status = 'Pending'
    OPTIONAL MATCH (s)-[:ALLOCATED_TO {status: 'Active'}]->(r:Room)
    RETURN c.complaint_id AS ComplaintID,
           c.category AS ComplaintType,
           c.description AS Description,
           c.priority AS Priority,
           c.raised_date AS DateFiled,
           c.status AS Status,
           s.student_name AS StudentName,
           coalesce(r.room_no, 'Resident') AS RoomNumber
    ORDER BY c.complaint_id DESC LIMIT 5
    """
    open_complaints = cypher_query(comp_cypher)

    # Maintenance Issues
    maint_cypher = """
    MATCH (m:MaintenanceRequest)-[:FOR_ROOM]->(r:Room)
    WHERE m.status = 'Pending'
    RETURN m.request_id AS RequestID,
           m.issue_type AS RequestType,
           m.description AS Description,
           m.priority AS Priority,
           m.raised_date AS DateRaised,
           m.status AS Status,
           r.room_no AS RoomNumber
    ORDER BY m.request_id DESC LIMIT 5
    """
    maintenance_issues = cypher_query(maint_cypher)

    return {
        "recentAllocations": recent_allocations,
        "recentPayments": recent_payments,
        "openComplaints": open_complaints,
        "maintenanceIssues": maintenance_issues
    }


# ==========================================
# 3. STUDENT MANAGEMENT CRUD
# ==========================================

@app.get("/api/students")
def get_students(
    search: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None
):
    cypher = """
    MATCH (s:Student)
    WHERE ($search IS NULL OR toLower(s.student_name) CONTAINS toLower($search) 
           OR toLower(s.reg_no) CONTAINS toLower($search) OR s.phone CONTAINS $search)
      AND ($department IS NULL OR s.course = $department)
    OPTIONAL MATCH (s)-[ra:ALLOCATED_TO {status: 'Active'}]->(r:Room)-[:LOCATED_IN]->(b:Block)-[:BELONGS_TO]->(h:Hostel)
    WITH s, ra, r, b, h
    WHERE ($status IS NULL OR $status = 'All' 
           OR ($status = 'Allocated' AND ra IS NOT NULL)
           OR ($status = 'Unallocated' AND ra IS NULL))
    RETURN s.student_id AS StudentID,
           s.student_name AS Name,
           s.gender AS Gender,
           s.dob AS DOB,
           s.course AS Department,
           s.year AS Year,
           s.phone AS ContactNumber,
           s.reg_no AS RegNo,
           s.email AS Email,
           ra.alloc_id AS AllocationID,
           ra.date_from AS AllocationDate,
           ra.status AS AllocationStatus,
           r.room_id AS RoomID,
           r.room_no AS RoomNumber,
           r.type AS RoomType,
           b.block_name AS BlockName,
           h.hostel_id AS HostelID,
           h.hostel_name AS HostelName
    ORDER BY s.student_id ASC
    """
    params = {
        "search": search.strip() if search else None,
        "department": department if department else None,
        "status": status if status else None
    }
    return cypher_query(cypher, params)


@app.get("/api/students/{student_id}")
def get_student(student_id: int):
    cypher = """
    MATCH (s:Student {student_id: $student_id})
    OPTIONAL MATCH (s)-[ra:ALLOCATED_TO {status: 'Active'}]->(r:Room)-[:LOCATED_IN]->(b:Block)-[:BELONGS_TO]->(h:Hostel)
    RETURN s.student_id AS StudentID,
           s.student_name AS Name,
           s.gender AS Gender,
           s.dob AS DOB,
           s.course AS Department,
           s.year AS Year,
           s.phone AS ContactNumber,
           s.reg_no AS RegNo,
           s.email AS Email,
           ra.alloc_id AS AllocationID,
           ra.date_from AS AllocationDate,
           ra.status AS AllocationStatus,
           r.room_id AS RoomID,
           r.room_no AS RoomNumber,
           r.type AS RoomType,
           b.block_name AS BlockName,
           h.hostel_id AS HostelID,
           h.hostel_name AS HostelName
    """
    rows = cypher_query(cypher, {"student_id": student_id})
    if not rows:
        raise HTTPException(status_code=404, detail="Student not found")

    student = dict(rows[0])

    # Fetch payments
    pay_cypher = """
    MATCH (s:Student {student_id: $student_id})-[:MADE]->(p:Payment)
    RETURN p.payment_id AS PaymentID,
           p.amount AS Amount,
           p.pay_date AS PaymentDate,
           p.payment_mode AS PaymentMode,
           p.payment_type AS PaymentType,
           p.status AS Status,
           p.receipt_number AS ReceiptNumber
    ORDER BY p.payment_id DESC
    """
    student["payments"] = cypher_query(pay_cypher, {"student_id": student_id})

    # Fetch complaints
    comp_cypher = """
    MATCH (s:Student {student_id: $student_id})-[:RAISED]->(c:Complaint)
    RETURN c.complaint_id AS ComplaintID,
           c.category AS ComplaintType,
           c.description AS Description,
           c.priority AS Priority,
           c.raised_date AS DateFiled,
           c.status AS Status
    ORDER BY c.complaint_id DESC
    """
    student["complaints"] = cypher_query(comp_cypher, {"student_id": student_id})

    # Fetch emergency contacts
    ec_cypher = """
    MATCH (ec:EmergencyContact)-[:CONTACT_FOR]->(s:Student {student_id: $student_id})
    RETURN ec.contact_id AS ContactID,
           ec.name AS Name,
           ec.phone AS PhoneNumber,
           ec.relation AS Relationship
    ORDER BY ec.contact_id ASC
    """
    student["emergencyContacts"] = cypher_query(ec_cypher, {"student_id": student_id})

    return student


@app.post("/api/students", status_code=status.HTTP_201_CREATED)
def create_student(payload: StudentCreate):
    # Check reg_no uniqueness
    existing_reg = cypher_query("MATCH (s:Student {reg_no: $reg_no}) RETURN s.student_id AS id", {"reg_no": payload.reg_no})
    if existing_reg:
        raise HTTPException(
            status_code=400,
            detail=f"Student with registration number '{payload.reg_no}' already exists."
        )

    # Next student ID
    max_res = cypher_query("MATCH (s:Student) RETURN coalesce(max(s.student_id), 1157) AS max_id")
    new_id = max_res[0]["max_id"] + 1

    create_cypher = """
    CREATE (s:Student {
        student_id: $student_id,
        student_name: $name,
        gender: $gender,
        dob: $dob,
        course: $department,
        year: $year,
        phone: $contact_number,
        reg_no: $reg_no,
        email: $email
    })
    RETURN properties(s) AS s
    """
    params = {
        "student_id": new_id,
        "name": payload.name,
        "gender": payload.gender,
        "dob": payload.dob,
        "department": payload.department,
        "year": payload.year,
        "contact_number": payload.contact_number,
        "reg_no": payload.reg_no,
        "email": payload.email
    }
    res = cypher_write(create_cypher, params)
    return res[0]["s"]


@app.put("/api/students/{student_id}")
def update_student(student_id: int, payload: StudentUpdate):
    exists = cypher_query("MATCH (s:Student {student_id: $student_id}) RETURN s.student_id AS id", {"student_id": student_id})
    if not exists:
        raise HTTPException(status_code=404, detail="Student not found")

    cypher = """
    MATCH (s:Student {student_id: $student_id})
    SET s.student_name = coalesce($name, s.student_name),
        s.gender = coalesce($gender, s.gender),
        s.course = coalesce($department, s.course),
        s.year = coalesce($year, s.year),
        s.phone = coalesce($contact_number, s.phone),
        s.email = coalesce($email, s.email)
    RETURN s.student_id AS studentId
    """
    params = {
        "student_id": student_id,
        "name": payload.name,
        "gender": payload.gender,
        "department": payload.department,
        "year": payload.year,
        "contact_number": payload.contact_number,
        "email": payload.email
    }
    cypher_write(cypher, params)
    return {"message": "Student updated successfully", "studentId": student_id}


@app.delete("/api/students/{student_id}")
def delete_student(student_id: int):
    # Verify student exists
    exists = cypher_query("MATCH (s:Student {student_id: $student_id}) RETURN s.student_id AS id", {"student_id": student_id})
    if not exists:
        raise HTTPException(status_code=404, detail="Student not found")

    # Safe deletion check: reject if dependent records exist
    dep_cypher = """
    MATCH (s:Student {student_id: $student_id})
    OPTIONAL MATCH (s)-[:MADE]->(p:Payment)
    OPTIONAL MATCH (s)-[:RAISED]->(c:Complaint)
    OPTIONAL MATCH (v:Visitor)-[:VISITED]->(s)
    OPTIONAL MATCH (ec:EmergencyContact)-[:CONTACT_FOR]->(s)
    OPTIONAL MATCH (s)-[a:ALLOCATED_TO]->()
    RETURN count(p) AS payments,
           count(c) AS complaints,
           count(v) AS visitors,
           count(ec) AS emergency_contacts,
           count(a) AS allocations
    """
    dep_res = cypher_query(dep_cypher, {"student_id": student_id})
    deps = dep_res[0] if dep_res else {}
    if (deps.get("payments", 0) > 0 or 
        deps.get("complaints", 0) > 0 or 
        deps.get("visitors", 0) > 0 or 
        deps.get("emergency_contacts", 0) > 0 or 
        deps.get("allocations", 0) > 0):
        details = []
        if deps.get("allocations", 0): details.append(f"{deps['allocations']} room allocations")
        if deps.get("payments", 0): details.append(f"{deps['payments']} payments")
        if deps.get("complaints", 0): details.append(f"{deps['complaints']} complaints")
        if deps.get("visitors", 0): details.append(f"{deps['visitors']} visitors")
        if deps.get("emergency_contacts", 0): details.append(f"{deps['emergency_contacts']} emergency contacts")
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete student with active or historical records: {', '.join(details)}. Vacate room or clear dependencies first."
        )

    cypher_write("MATCH (s:Student {student_id: $student_id}) DELETE s", {"student_id": student_id})
    return {"message": "Student deleted successfully", "studentId": student_id}


# ==========================================
# 4. HOSTELS, BLOCKS, ROOMS
# ==========================================

@app.get("/api/hostels")
def get_hostels():
    cypher = """
    MATCH (h:Hostel)
    RETURN h.hostel_id AS HostelID,
           h.hostel_name AS HostelName,
           h.type AS HostelType,
           h.capacity AS TotalCapacity,
           h.address AS Address
    ORDER BY h.hostel_id ASC
    """
    return cypher_query(cypher)


@app.post("/api/hostels", status_code=status.HTTP_201_CREATED)
def create_hostel(payload: HostelCreate):
    max_res = cypher_query("MATCH (h:Hostel) RETURN coalesce(max(h.hostel_id), 3) AS max_id")
    new_id = max_res[0]["max_id"] + 1

    create_cypher = """
    CREATE (h:Hostel {
        hostel_id: $hostel_id,
        hostel_name: $name,
        type: $type,
        address: 'VIT Chennai',
        capacity: $capacity
    })
    RETURN h.hostel_id AS hostelId, h.hostel_name AS hostelName
    """
    params = {
        "hostel_id": new_id,
        "name": payload.name,
        "type": payload.type,
        "capacity": payload.total_capacity
    }
    res = cypher_write(create_cypher, params)
    return res[0]


@app.get("/api/blocks")
def get_blocks(hostel_id: Optional[int] = None):
    cypher = """
    MATCH (b:Block)-[:BELONGS_TO]->(h:Hostel)
    WHERE ($hostel_id IS NULL OR h.hostel_id = $hostel_id)
    RETURN b.block_id AS BlockID,
           b.block_name AS BlockName,
           b.floor AS TotalFloors,
           h.hostel_id AS HostelID,
           h.hostel_name AS HostelName
    ORDER BY b.block_id ASC
    """
    return cypher_query(cypher, {"hostel_id": hostel_id})


@app.post("/api/blocks", status_code=status.HTTP_201_CREATED)
def create_block(payload: BlockCreate):
    # Verify hostel exists
    h_exists = cypher_query("MATCH (h:Hostel {hostel_id: $hostel_id}) RETURN h", {"hostel_id": payload.hostel_id})
    if not h_exists:
        raise HTTPException(status_code=404, detail="Hostel not found")

    max_res = cypher_query("MATCH (b:Block) RETURN coalesce(max(b.block_id), 301) AS max_id")
    new_id = max_res[0]["max_id"] + 1

    create_cypher = """
    MATCH (h:Hostel {hostel_id: $hostel_id})
    CREATE (b:Block {
        block_id: $block_id,
        block_name: $name,
        floor: $floor,
        hostel_id: $hostel_id
    })-[:BELONGS_TO]->(h)
    RETURN b.block_id AS blockId, b.block_name AS blockName
    """
    params = {
        "block_id": new_id,
        "name": payload.name,
        "floor": payload.total_floors,
        "hostel_id": payload.hostel_id
    }
    res = cypher_write(create_cypher, params)
    return res[0]


@app.get("/api/rooms")
def get_rooms(
    hostel_id: Optional[int] = None,
    block_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None
):
    cypher = """
    MATCH (r:Room)-[:LOCATED_IN]->(b:Block)-[:BELONGS_TO]->(h:Hostel)
    WHERE ($hostel_id IS NULL OR h.hostel_id = $hostel_id)
      AND ($block_id IS NULL OR b.block_id = $block_id)
      AND ($status IS NULL OR $status = 'All' OR r.status = $status)
      AND ($search IS NULL OR toLower(r.room_no) CONTAINS toLower($search) OR toLower(b.block_name) CONTAINS toLower($search))
    RETURN r.room_id AS RoomID,
           r.room_no AS RoomNumber,
           r.type AS RoomType,
           r.floor_no AS FloorNumber,
           r.status AS Status,
           r.capacity AS Capacity,
           r.current_occupancy AS CurrentOccupancy,
           b.block_id AS BlockID,
           b.block_name AS BlockName,
           h.hostel_id AS HostelID,
           h.hostel_name AS HostelName,
           h.type AS HostelType
    ORDER BY r.room_id ASC
    """
    params = {
        "hostel_id": hostel_id,
        "block_id": block_id,
        "status": status,
        "search": search.strip() if search else None
    }
    return cypher_query(cypher, params)


@app.get("/api/rooms/{room_id}")
def get_room_detail(room_id: int):
    cypher = """
    MATCH (r:Room {room_id: $room_id})-[:LOCATED_IN]->(b:Block)-[:BELONGS_TO]->(h:Hostel)
    RETURN r.room_id AS RoomID,
           r.room_no AS RoomNumber,
           r.type AS RoomType,
           r.floor_no AS FloorNumber,
           r.status AS Status,
           r.capacity AS Capacity,
           r.current_occupancy AS CurrentOccupancy,
           b.block_id AS BlockID,
           b.block_name AS BlockName,
           h.hostel_id AS HostelID,
           h.hostel_name AS HostelName,
           h.type AS HostelType
    """
    rows = cypher_query(cypher, {"room_id": room_id})
    if not rows:
        raise HTTPException(status_code=404, detail="Room not found")

    room = dict(rows[0])

    # Active occupants
    occ_cypher = """
    MATCH (s:Student)-[ra:ALLOCATED_TO {status: 'Active'}]->(r:Room {room_id: $room_id})
    RETURN ra.alloc_id AS AllocationID,
           ra.date_from AS AllocationDate,
           s.student_id AS StudentID,
           s.reg_no AS RegNo,
           s.student_name AS Name,
           s.phone AS ContactNumber,
           s.course AS Department
    ORDER BY ra.alloc_id ASC
    """
    room["occupants"] = cypher_query(occ_cypher, {"room_id": room_id})

    # Maintenance
    maint_cypher = """
    MATCH (m:MaintenanceRequest)-[:FOR_ROOM]->(r:Room {room_id: $room_id})
    RETURN m.request_id AS RequestID,
           m.issue_type AS RequestType,
           m.description AS Description,
           m.status AS Status,
           m.raised_date AS DateRaised
    ORDER BY m.request_id DESC
    """
    room["maintenance"] = cypher_query(maint_cypher, {"room_id": room_id})

    return room


@app.post("/api/rooms", status_code=status.HTTP_201_CREATED)
def create_room(payload: RoomCreate):
    max_res = cypher_query("MATCH (r:Room) RETURN coalesce(max(r.room_id), 4001) AS max_id")
    new_id = max_res[0]["max_id"] + 1

    create_cypher = """
    MATCH (b:Block {block_id: 101})
    CREATE (r:Room {
        room_id: $room_id,
        room_no: $room_no,
        type: $room_type,
        floor_no: $floor_no,
        status: 'Available',
        block_id: 101,
        capacity: $capacity,
        current_occupancy: 0
    })-[:LOCATED_IN]->(b)
    RETURN r.room_id AS roomId, r.room_no AS roomNumber
    """
    params = {
        "room_id": new_id,
        "room_no": payload.room_number,
        "room_type": payload.room_type,
        "floor_no": payload.floor_id,
        "capacity": payload.capacity
    }
    res = cypher_write(create_cypher, params)
    return res[0]


# ==========================================
# 5. ALLOCATIONS
# ==========================================

@app.get("/api/allocations")
def get_allocations(status: Optional[str] = None):
    cypher = """
    MATCH (s:Student)-[ra:ALLOCATED_TO]->(r:Room)-[:LOCATED_IN]->(b:Block)-[:BELONGS_TO]->(h:Hostel)
    WHERE ($status IS NULL OR $status = 'All' OR ra.status = $status)
    RETURN ra.alloc_id AS AllocationID,
           s.student_id AS StudentID,
           r.room_id AS RoomID,
           ra.date_from AS AllocationDate,
           ra.date_to AS VacateDate,
           ra.status AS Status,
           s.reg_no AS RegNo,
           s.student_name AS StudentName,
           s.course AS Department,
           s.phone AS StudentContact,
           r.room_no AS RoomNumber,
           r.type AS RoomType,
           r.capacity AS Capacity,
           r.current_occupancy AS CurrentOccupancy,
           b.block_name AS BlockName,
           h.hostel_name AS HostelName
    ORDER BY ra.alloc_id DESC
    """
    return cypher_query(cypher, {"status": status})


@app.post("/api/allocations", status_code=status.HTTP_201_CREATED)
def create_allocation(payload: AllocationCreate):
    # 1. Student check
    s_rows = cypher_query("MATCH (s:Student {student_id: $student_id}) RETURN s.student_name AS name", {"student_id": payload.student_id})
    if not s_rows:
        raise HTTPException(status_code=404, detail="Student not found")

    # 2. Check if student already has an active allocation
    active_alloc = cypher_query("""
        MATCH (s:Student {student_id: $student_id})-[a:ALLOCATED_TO {status: 'Active'}]->(r:Room)
        RETURN r.room_no AS room_no, a.alloc_id AS alloc_id
    """, {"student_id": payload.student_id})
    if active_alloc:
        current_room = active_alloc[0]["room_no"]
        raise HTTPException(
            status_code=400,
            detail=f"Student already has an active room allocation in room {current_room}. Please vacate the existing room first."
        )

    # 3. Check room capacity and occupancy
    r_rows = cypher_query("""
        MATCH (r:Room {room_id: $room_id})
        OPTIONAL MATCH (:Student)-[a:ALLOCATED_TO {status: 'Active'}]->(r)
        RETURN r.capacity AS capacity, count(a) AS current_occupancy, r.status AS status
    """, {"room_id": payload.room_id})
    if not r_rows:
        raise HTTPException(status_code=404, detail="Room not found")

    cap = r_rows[0]["capacity"] or 2
    occ = r_rows[0]["current_occupancy"] or 0
    if occ >= cap:
        raise HTTPException(
            status_code=400,
            detail=f"Room is already fully occupied ({occ}/{cap} beds)."
        )

    # 4. Generate new allocation ID
    max_res = cypher_query("MATCH ()-[a:ALLOCATED_TO]->() RETURN coalesce(max(a.alloc_id), 706) AS max_id")
    new_id = max_res[0]["max_id"] + 1

    create_alloc_cypher = """
    MATCH (s:Student {student_id: $student_id})
    MATCH (r:Room {room_id: $room_id})
    CREATE (s)-[rel:ALLOCATED_TO {
        alloc_id: $alloc_id,
        date_from: $allocation_date,
        date_to: '2027-06-30',
        status: 'Active'
    }]->(r)
    RETURN rel.alloc_id AS alloc_id
    """
    params = {
        "student_id": payload.student_id,
        "room_id": payload.room_id,
        "alloc_id": new_id,
        "allocation_date": payload.allocation_date
    }
    cypher_write(create_alloc_cypher, params)

    # Update room occupancy
    update_room_occupancy_status(payload.room_id)

    return {"allocationId": new_id, "status": "Active"}


@app.post("/api/allocations/{allocation_id}/vacate")
@app.put("/api/allocations/{allocation_id}/vacate")
def vacate_allocation(allocation_id: int):
    # Find allocation edge
    check_cypher = """
    MATCH ()-[ra:ALLOCATED_TO {alloc_id: $allocation_id}]->(r:Room)
    RETURN r.room_id AS room_id, ra.status AS status
    """
    rows = cypher_query(check_cypher, {"allocation_id": allocation_id})
    if not rows:
        raise HTTPException(status_code=404, detail="Allocation not found")

    room_id = rows[0]["room_id"]
    today_str = datetime.date.today().isoformat()

    vacate_cypher = """
    MATCH ()-[ra:ALLOCATED_TO {alloc_id: $allocation_id}]->(r:Room)
    SET ra.status = 'Vacated',
        ra.date_to = $today_str
    RETURN ra.alloc_id AS alloc_id
    """
    cypher_write(vacate_cypher, {"allocation_id": allocation_id, "today_str": today_str})

    # Update room occupancy
    update_room_occupancy_status(room_id)

    return {"message": "Room vacated", "allocationId": allocation_id, "vacateDate": today_str}


# ==========================================
# 6. PAYMENTS
# ==========================================

@app.get("/api/payments")
def get_payments(search: Optional[str] = None, status: Optional[str] = None):
    cypher = """
    MATCH (s:Student)-[:MADE]->(p:Payment)
    WHERE ($search IS NULL OR toLower(s.student_name) CONTAINS toLower($search) 
           OR toLower(s.reg_no) CONTAINS toLower($search) OR toLower(p.receipt_number) CONTAINS toLower($search))
      AND ($status IS NULL OR $status = 'All' OR p.status = $status)
    RETURN p.payment_id AS PaymentID,
           p.amount AS Amount,
           p.payment_mode AS PaymentMode,
           p.pay_date AS PaymentDate,
           p.status AS Status,
           p.receipt_number AS ReceiptNumber,
           p.payment_type AS PaymentType,
           s.student_name AS StudentName,
           s.reg_no AS RegNo,
           s.course AS Department
    ORDER BY p.payment_id DESC
    """
    params = {
        "search": search.strip() if search else None,
        "status": status if status else None
    }
    return cypher_query(cypher, params)


@app.post("/api/payments", status_code=status.HTTP_201_CREATED)
def create_payment(payload: PaymentCreate):
    # Verify student exists
    s_rows = cypher_query("MATCH (s:Student {student_id: $student_id}) RETURN s", {"student_id": payload.student_id})
    if not s_rows:
        raise HTTPException(status_code=404, detail="Student not found")

    max_res = cypher_query("MATCH (p:Payment) RETURN coalesce(max(p.payment_id), 806) AS max_id")
    new_id = max_res[0]["max_id"] + 1
    receipt = payload.receipt_number or f"REC-{new_id}"
    pay_status = 'Paid' if payload.status in ('Paid', 'Completed') else 'Pending'

    create_cypher = """
    MATCH (s:Student {student_id: $student_id})
    MATCH (st:Staff {staff_id: 601})
    CREATE (p:Payment {
        payment_id: $payment_id,
        amount: $amount,
        payment_mode: $payment_mode,
        pay_date: $payment_date,
        status: $status,
        staff_id: 601,
        student_id: $student_id,
        receipt_number: $receipt_number,
        payment_type: $payment_type
    })
    CREATE (s)-[:MADE]->(p)
    CREATE (p)-[:PROCESSED_BY]->(st)
    RETURN p.payment_id AS paymentId, p.receipt_number AS receiptNumber, p.amount AS amount
    """
    params = {
        "payment_id": new_id,
        "amount": payload.amount,
        "payment_mode": payload.payment_mode,
        "payment_date": payload.payment_date,
        "status": pay_status,
        "student_id": payload.student_id,
        "receipt_number": receipt,
        "payment_type": payload.payment_type
    }
    res = cypher_write(create_cypher, params)
    return res[0]


# ==========================================
# 7. COMPLAINTS & MAINTENANCE
# ==========================================

@app.get("/api/complaints")
def get_complaints(status: Optional[str] = None):
    cypher = """
    MATCH (s:Student)-[:RAISED]->(c:Complaint)
    WHERE ($status IS NULL OR $status = 'All' OR c.status = $status)
    OPTIONAL MATCH (s)-[:ALLOCATED_TO {status: 'Active'}]->(r:Room)-[:LOCATED_IN]->(b:Block)-[:BELONGS_TO]->(h:Hostel)
    OPTIONAL MATCH (c)-[:HANDLED_BY]->(st:Staff)
    RETURN c.complaint_id AS ComplaintID,
           c.category AS ComplaintType,
           c.description AS Description,
           c.status AS Status,
           c.raised_date AS DateFiled,
           c.priority AS Priority,
           s.student_name AS StudentName,
           s.reg_no AS RegNo,
           r.room_no AS RoomNumber,
           h.hostel_name AS HostelName,
           st.staff_name AS HandledByName
    ORDER BY c.complaint_id DESC
    """
    return cypher_query(cypher, {"status": status})


@app.post("/api/complaints", status_code=status.HTTP_201_CREATED)
def create_complaint(payload: ComplaintCreate):
    s_rows = cypher_query("MATCH (s:Student {student_id: $student_id}) RETURN s", {"student_id": payload.student_id})
    if not s_rows:
        raise HTTPException(status_code=404, detail="Student not found")

    max_res = cypher_query("MATCH (c:Complaint) RETURN coalesce(max(c.complaint_id), 904) AS max_id")
    new_id = max_res[0]["max_id"] + 1

    create_cypher = """
    MATCH (s:Student {student_id: $student_id})
    MATCH (st:Staff {staff_id: 602})
    CREATE (c:Complaint {
        complaint_id: $complaint_id,
        category: $category,
        description: $description,
        status: 'Pending',
        raised_date: $raised_date,
        student_id: $student_id,
        priority: $priority,
        handled_by: 602
    })
    CREATE (s)-[:RAISED]->(c)
    CREATE (c)-[:HANDLED_BY]->(st)
    RETURN c.complaint_id AS complaintId, c.status AS status
    """
    params = {
        "complaint_id": new_id,
        "category": payload.complaint_type,
        "description": payload.description,
        "raised_date": payload.date_filed,
        "student_id": payload.student_id,
        "priority": payload.priority
    }
    res = cypher_write(create_cypher, params)
    return res[0]


@app.put("/api/complaints/{complaint_id}/status")
def update_complaint_status(complaint_id: int, payload: ComplaintStatusUpdate):
    exists = cypher_query("MATCH (c:Complaint {complaint_id: $complaint_id}) RETURN c", {"complaint_id": complaint_id})
    if not exists:
        raise HTTPException(status_code=404, detail="Complaint not found")

    cypher = """
    MATCH (c:Complaint {complaint_id: $complaint_id})
    SET c.status = $status
    RETURN c.complaint_id AS cid
    """
    cypher_write(cypher, {"complaint_id": complaint_id, "status": payload.status})
    return {"message": "Status updated"}


@app.get("/api/maintenance")
def get_maintenance(status: Optional[str] = None):
    cypher = """
    MATCH (m:MaintenanceRequest)-[:FOR_ROOM]->(r:Room)-[:LOCATED_IN]->(b:Block)-[:BELONGS_TO]->(h:Hostel)
    WHERE ($status IS NULL OR $status = 'All' OR m.status = $status)
    OPTIONAL MATCH (m)-[:ASSIGNED_TO]->(st:Staff)
    RETURN m.request_id AS RequestID,
           m.issue_type AS RequestType,
           m.description AS Description,
           m.status AS Status,
           m.raised_date AS DateRaised,
           m.priority AS Priority,
           r.room_no AS RoomNumber,
           b.block_name AS BlockName,
           h.hostel_name AS HostelName,
           st.staff_name AS StaffName
    ORDER BY m.request_id DESC
    """
    return cypher_query(cypher, {"status": status})


@app.post("/api/maintenance", status_code=status.HTTP_201_CREATED)
def create_maintenance(payload: MaintenanceCreate):
    r_rows = cypher_query("MATCH (r:Room {room_id: $room_id}) RETURN r", {"room_id": payload.room_id})
    if not r_rows:
        raise HTTPException(status_code=404, detail="Room not found")

    max_res = cypher_query("MATCH (m:MaintenanceRequest) RETURN coalesce(max(m.request_id), 1204) AS max_id")
    new_id = max_res[0]["max_id"] + 1

    create_cypher = """
    MATCH (r:Room {room_id: $room_id})
    MATCH (st:Staff {staff_id: 603})
    CREATE (m:MaintenanceRequest {
        request_id: $request_id,
        issue_type: $request_type,
        description: $description,
        status: 'Pending',
        raised_date: $date_raised,
        room_id: $room_id,
        priority: $priority,
        assigned_staff: 603
    })
    CREATE (m)-[:FOR_ROOM]->(r)
    CREATE (m)-[:ASSIGNED_TO]->(st)
    RETURN m.request_id AS requestId, m.status AS status
    """
    params = {
        "request_id": new_id,
        "request_type": payload.request_type,
        "description": payload.description,
        "date_raised": payload.date_raised,
        "room_id": payload.room_id,
        "priority": payload.priority
    }
    res = cypher_write(create_cypher, params)
    return res[0]


@app.put("/api/maintenance/{request_id}/status")
def update_maintenance_status(request_id: int, payload: MaintenanceStatusUpdate):
    exists = cypher_query("MATCH (m:MaintenanceRequest {request_id: $request_id}) RETURN m", {"request_id": request_id})
    if not exists:
        raise HTTPException(status_code=404, detail="Maintenance request not found")

    cypher = """
    MATCH (m:MaintenanceRequest {request_id: $request_id})
    SET m.status = $status
    RETURN m.request_id AS mid
    """
    cypher_write(cypher, {"request_id": request_id, "status": payload.status})
    return {"message": "Status updated"}


# ==========================================
# 8. VISITORS, STAFF, WARDENS, EMERGENCY CONTACTS
# ==========================================

@app.get("/api/visitors")
def get_visitors():
    cypher = """
    MATCH (v:Visitor)-[:VISITED]->(s:Student)
    OPTIONAL MATCH (v)-[:APPROVED_BY]->(st:Staff)
    RETURN v.visitor_id AS VisitorID,
           v.name AS Name,
           v.id_proof AS ContactNumber,
           'Meet Student' AS RelationToStudent,
           v.visit_time AS CheckInTime,
           v.purpose AS Purpose,
           s.student_name AS StudentName,
           s.reg_no AS RegNo,
           st.staff_name AS ApprovedByName
    ORDER BY v.visitor_id DESC
    """
    return cypher_query(cypher)


@app.post("/api/visitors", status_code=status.HTTP_201_CREATED)
def create_visitor(payload: VisitorCreate):
    s_rows = cypher_query("MATCH (s:Student {student_id: $student_id}) RETURN s", {"student_id": payload.student_id})
    if not s_rows:
        raise HTTPException(status_code=404, detail="Student not found")

    max_res = cypher_query("MATCH (v:Visitor) RETURN coalesce(max(v.visitor_id), 1104) AS max_id")
    new_id = max_res[0]["max_id"] + 1

    create_cypher = """
    MATCH (s:Student {student_id: $student_id})
    MATCH (st:Staff {staff_id: 601})
    CREATE (v:Visitor {
        visitor_id: $visitor_id,
        name: $name,
        id_proof: $id_proof,
        visit_time: $visit_time,
        purpose: $purpose,
        student_id: $student_id,
        approved_by: 601
    })
    CREATE (v)-[:VISITED]->(s)
    CREATE (v)-[:APPROVED_BY]->(st)
    RETURN v.visitor_id AS visitorId, v.name AS name
    """
    params = {
        "visitor_id": new_id,
        "name": payload.name,
        "id_proof": payload.contact_number,
        "visit_time": payload.check_in_time,
        "purpose": payload.relation_to_student,
        "student_id": payload.student_id
    }
    res = cypher_write(create_cypher, params)
    return res[0]


@app.get("/api/staff")
def get_staff():
    cypher = """
    MATCH (st:Staff)
    OPTIONAL MATCH (st)-[:ASSIGNED_TO]->(h:Hostel)
    RETURN st.staff_id AS StaffID,
           st.staff_name AS Name,
           st.staff_designation AS Role,
           st.staff_gender AS Gender,
           ('044-3993' + toString(st.staff_id)) AS ContactNumber,
           'Morning' AS Shift,
           st.join_date AS DateOfJoining,
           h.hostel_name AS HostelName
    ORDER BY st.staff_id ASC
    """
    return cypher_query(cypher)


@app.get("/api/wardens")
def get_wardens():
    cypher = """
    MATCH (w:Warden)
    OPTIONAL MATCH (w)-[:MANAGES]->(b:Block)-[:BELONGS_TO]->(h:Hostel)
    RETURN w.warden_id AS WardenID,
           w.warden_name AS Name,
           w.warden_phone AS ContactNumber,
           w.warden_email AS Email,
           '2023-01-01' AS DateOfJoining,
           h.hostel_name AS HostelName,
           h.type AS HostelType
    ORDER BY w.warden_id ASC
    """
    return cypher_query(cypher)


@app.get("/api/emergency-contacts")
def get_emergency_contacts():
    cypher = """
    MATCH (ec:EmergencyContact)-[:CONTACT_FOR]->(s:Student)
    RETURN ec.contact_id AS ContactID,
           ec.name AS Name,
           ec.relation AS Relationship,
           ec.phone AS PhoneNumber,
           s.student_name AS StudentName,
           s.reg_no AS RegNo,
           s.course AS Department
    ORDER BY ec.contact_id ASC
    """
    return cypher_query(cypher)


# ==========================================
# 9. GRAPH DATABASE
# ==========================================

@app.get("/api/graph")
def get_graph():
    return neo4j_manager.get_full_graph()
