# HostelOS — College Hostel Management System
### BACSE202 Database Systems — Digital Assignment 3 (DA-3)

**Project Team Members:**
| Registration Number | Team Member Name | Program / Department |
| :--- | :--- | :--- |
| **25BAI1012** | JESSICA KATHERINE K | B.Tech CSE (AI & ML) |
| **25BAI1150** | G S JANANI | B.Tech CSE (AI & ML) |
| **25BAI1176** | JYOTISH N | B.Tech CSE (AI & ML) |

**Institution:** School of Computer Science and Engineering, Vellore Institute of Technology (VIT Chennai)  
**Course:** BACSE202 Database Systems  
**Academic Context:** Digital Assignment 3 (DA-3)  
**Authoritative Database Engine:** Neo4j Graph Database (`bolt://localhost:7687`)  

---

## 1. Project Overview & DA3 Architecture

**HostelOS** is an academic hostel operations platform developed for **BACSE202 Digital Assignment 3 (DA-3)**. It re-implements and modernizes the relational Oracle SQL hostel management system from **DA-1 & DA-2** using a native **Neo4j Property Graph Database**.

### Key Architectural Evolution (Oracle SQL -> Neo4j Graph):
- **Elimination of Multi-Table JOIN Bottlenecks:** In Oracle SQL (DA-2 Query 13, 14, 16), finding a student's hostel assignment required 4-table relational JOINs (`student` -> `room_allocation` -> `room` -> `block` -> `hostel`). In Neo4j, this is resolved via native index-free adjacency:
  ```cypher
  MATCH (s:Student)-[:ALLOCATED_TO]->(r:Room)-[:LOCATED_IN]->(b:Block)-[:BELONGS_TO]->(h:Hostel)
  RETURN s.student_name, r.room_no, b.block_name, h.hostel_name
  ```
- **Authoritative Graph Storage:** Application reads and writes execute directly against the live Neo4j database using parameterized Cypher queries through the official Neo4j Python driver. SQLite is strictly preserved as an archived reference and safety backup (`backend/hostelos.db.backup`).
- **Academic Minimalist Frontend:** Clean, readable, distraction-free user interface designed specifically for academic evaluation.

---

## 2. Graph Schema & Data Model

The graph database models 11 distinct node labels and 13 relationship types:

### Node Labels (52 Total Nodes):
1. `:Hostel` (3 nodes) — Ganga (Girls), Yamuna (Girls), Cauvery (Boys)
2. `:Block` (4 nodes) — Ganga-A, Ganga-B, Yamuna-A, Cauvery-A
3. `:Room` (6 nodes) — A101, A102, A103, B201, C101, D101
4. `:Student` (9 nodes) — Janani, Priya, Harini, Divya, Arun, Karthik, Sneha, Rahul, Test Student
5. `:Warden` (3 nodes) — Lakshmi, Meena, Suresh
6. `:Staff` (4 nodes) — Ravi, Anitha, Mohan, Priya
7. `:Payment` (6 nodes) — Receipts REC-801 to REC-806 (₹2,16,000 paid, ₹45,000 pending)
8. `:Complaint` (4 nodes) — Tickets 901 to 904 (Electrical, Water, Internet, Cleaning)
9. `:EmergencyContact` (5 nodes) — Verified guardian contacts
10. `:Visitor` (4 nodes) — Campus visitor register
11. `:MaintenanceRequest` (4 nodes) — Facility repair requests

### Relationship Edges (65 Total Relationships):
- `(:Block)-[:BELONGS_TO]->(:Hostel)` [4]
- `(:Room)-[:LOCATED_IN]->(:Block)` [6]
- `(:Warden)-[:MANAGES]->(:Block)` [3]
- `(:Staff)-[:ASSIGNED_TO]->(:Hostel)` [4]
- `(:Student)-[:ALLOCATED_TO {alloc_id, date_from, date_to, status}]->(:Room)` [7]
- `(:Student)-[:MADE]->(:Payment)` [6]
- `(:Payment)-[:PROCESSED_BY]->(:Staff)` [6]
- `(:Student)-[:RAISED]->(:Complaint)` [4]
- `(:Complaint)-[:HANDLED_BY]->(:Staff)` [4]
- `(:EmergencyContact)-[:CONTACT_FOR]->(:Student)` [5]
- `(:Visitor)-[:VISITED]->(:Student)` [4]
- `(:Visitor)-[:APPROVED_BY]->(:Staff)` [4]
- `(:MaintenanceRequest)-[:FOR_ROOM]->(:Room)` [4]
- `(:MaintenanceRequest)-[:ASSIGNED_TO]->(:Staff)` [4]

### Database Constraints & Indexes:
All 11 entity types are protected by native Neo4j uniqueness constraints:
- `constraint_student_id` on `(s:Student.student_id)`
- `constraint_hostel_id` on `(h:Hostel.hostel_id)`
- `constraint_block_id` on `(b:Block.block_id)`
- `constraint_room_id` on `(r:Room.room_id)`
- `constraint_warden_id` on `(w:Warden.warden_id)`
- `constraint_staff_id` on `(st:Staff.staff_id)`
- `constraint_payment_id` on `(p:Payment.payment_id)`
- `constraint_complaint_id` on `(c:Complaint.complaint_id)`
- `constraint_emergency_contact_id` on `(ec:EmergencyContact.contact_id)`
- `constraint_visitor_id` on `(v:Visitor.visitor_id)`
- `constraint_maintenance_id` on `(m:MaintenanceRequest.request_id)`
- Performance B-Tree Indexes on `Student.reg_no`, `Room.room_no`, `Payment.receipt_number`, and `Hostel.hostel_name`.

---

## 3. Prerequisites & Environment Configuration

### System Requirements:
- **Operating System:** macOS, Linux, or Windows (WSL2 recommended)
- **Python:** 3.9+ with `pip`
- **Node.js:** 18+ with `npm`
- **Neo4j:** Neo4j Community Server 5+ (or Neo4j Aura Cloud)
- **Java:** OpenJDK 21 (for local Neo4j server)

### Environment Variables:
Create `backend/.env` based on the template:
```bash
cp backend/.env.example backend/.env
```

Contents of `backend/.env` (replace with your local or cloud credentials):
```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_secure_password_here
```
> **Security Note:** `.env` files are strictly excluded from git via root `.gitignore`. Never commit credentials.

---

## 4. Setup, Seeding & Execution Guide

### Step 1: Start Neo4j Server
```bash
# If using Homebrew on macOS:
brew services start neo4j

# Or launch Neo4j console:
neo4j console
```
Verify Neo4j is accepting connections on `bolt://localhost:7687` (HTTP console on `http://localhost:7474`).

### Step 2: Initialize Graph Constraints & Indexes
```bash
cd backend
python3 setup_neo4j_schema.py
```

### Step 3: Seed Authoritative Data
```bash
python3 seed_neo4j.py
```
*Note: The seeder is 100% idempotent and can be safely executed repeatedly without creating duplicate nodes or edges.*

### Step 4: Verify Database Parity
```bash
python3 verify_neo4j_graph.py
```

### Step 5: Start Backend API Server
```bash
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- Interactive Swagger API Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/health`

### Step 6: Start Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```
Access the application at: `http://localhost:5173/`

---

## 5. Automated Testing & Verification Commands

### 1. API Integration Test Suite (58 Automated Tests)
Runs full validation across all 34 REST endpoints, room allocations, capacity limits, safe student deletions, and graph explorer exports:
```bash
python3 backend/test_api_endpoints.py
```
*Expected Result: 58 PASSED | 0 FAILED*

### 2. Restart Persistence Verification
Proves that mutations persist in Neo4j after stopping and restarting the FastAPI backend:
```bash
python3 backend/test_standalone_persistence.py
```

### 3. Frontend Production Build
Validates TypeScript compilation and asset bundling:
```bash
cd frontend
npm run build
```

---

## 6. Oracle SQL vs. Neo4j Cypher Comparison Evidence

| Operation | Oracle SQL (DA-1 & DA-2) | Neo4j Cypher (DA-3) | Complexity Difference |
| :--- | :--- | :--- | :--- |
| **Student Room Allocation** | Requires 4-table relational `JOIN`: `student` ⨝ `room_allocation` ⨝ `room` ⨝ `block` ⨝ `hostel` | Single multi-hop traversal: `(s:Student)-[:ALLOCATED_TO]->(r:Room)-[:LOCATED_IN]->(b:Block)-[:BELONGS_TO]->(h:Hostel)` | Reduces relational cost from $O(N \log N)$ disk-based hash joins to $O(1)$ index-free pointer dereference |
| **Capacity Enforcement** | Subquery with `COUNT(*)` over relational allocation table | Pattern match over active incoming edges: `MATCH (:Student)-[:ALLOCATED_TO {status: 'Active'}]->(r:Room)` | Direct graph edge degree calculation |
| **Grievance Resolution** | `JOIN complaint` with `staff` and `room_allocation` | `MATCH (s:Student)-[:RAISED]->(c:Complaint)-[:HANDLED_BY]->(st:Staff)` | Expressive graph pattern matching |
| **Schema Flexibility** | Rigid DDL schema; adding relationships requires intermediary junction tables (`room_allocation`) | Semi-structured property graph; relationships are first-class citizens storing their own properties (`date_from`, `status`) | Native relationship attributes without synthetic foreign key join tables |

---

## 7. Submission Artifacts Checklist for DA3

The following evidence items are prepared for the DA-3 report and presentation:
1. **System Health & DB Status:** Screenshot of `/api/health` confirming `Neo4j Graph Database (Authoritative Engine)`.
2. **Dashboard Overview:** Screenshot showing real metrics (9 students, 6 rooms, 6 occupied beds, ₹2,16,000 collected).
3. **Student Directory & Allocation Modal:** Screenshot of student table with active room badges.
4. **Room Allocations & Vacate Action:** Screenshot of allocation history showing active vs vacated beds.
5. **Interactive Graph Explorer:** Screenshot of the force-directed graph canvas visualizing 52 nodes and 65 edges.
6. **Neo4j Browser Console:** Screenshots of Cypher query executions (`MATCH (n) RETURN ...`, schema constraints).
7. **Test Suite Output:** Screenshot of terminal showing `58 PASSED | 0 FAILED`.
