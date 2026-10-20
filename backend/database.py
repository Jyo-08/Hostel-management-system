"""
HostelOS Database Engine — BACSE202 DA2 & DA3 Schema
Exact schema and structure from Jyotish N (25BAI1176) Digital Assignment 2
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "hostelos.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Drop existing tables to cleanly align with the PDF schema
    cursor.executescript("""
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS payment;
    DROP TABLE IF EXISTS complaint;
    DROP TABLE IF EXISTS emergency_contact;
    DROP TABLE IF EXISTS visitor;
    DROP TABLE IF EXISTS maintenance_request;
    DROP TABLE IF EXISTS room_allocation;
    DROP TABLE IF EXISTS room;
    DROP TABLE IF EXISTS warden;
    DROP TABLE IF EXISTS staff;
    DROP TABLE IF EXISTS block;
    DROP TABLE IF EXISTS hostel;
    DROP TABLE IF EXISTS student;
    PRAGMA foreign_keys = ON;
    """)

    # 1. Hostel (from DA2 page 3: hostel_id, hostel_name, type, address, capacity)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hostel (
        hostel_id INTEGER PRIMARY KEY,
        hostel_name TEXT NOT NULL,
        type TEXT NOT NULL,
        address TEXT NOT NULL,
        capacity INTEGER NOT NULL
    );
    """)

    # 2. Block (from DA2 page 3: block_id, block_name, floor, hostel_id)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS block (
        block_id INTEGER PRIMARY KEY,
        block_name TEXT NOT NULL,
        floor INTEGER NOT NULL,
        hostel_id INTEGER NOT NULL,
        FOREIGN KEY (hostel_id) REFERENCES hostel(hostel_id) ON DELETE CASCADE
    );
    """)

    # 3. Room (from DA2 page 3: room_id, room_no, type, floor_no, status, block_id)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS room (
        room_id INTEGER PRIMARY KEY,
        room_no TEXT NOT NULL,
        type TEXT NOT NULL,
        floor_no INTEGER NOT NULL,
        status TEXT NOT NULL,
        block_id INTEGER NOT NULL,
        capacity INTEGER DEFAULT 2,
        current_occupancy INTEGER DEFAULT 0,
        FOREIGN KEY (block_id) REFERENCES block(block_id) ON DELETE CASCADE
    );
    """)

    # 4. Student (from DA2 page 4: student_id, student_name, gender, dob, course, year, phone)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS student (
        student_id INTEGER PRIMARY KEY,
        student_name TEXT NOT NULL,
        gender TEXT NOT NULL,
        dob TEXT NOT NULL,
        course TEXT NOT NULL,
        year INTEGER NOT NULL,
        phone TEXT NOT NULL,
        reg_no TEXT,
        email TEXT
    );
    """)

    # 5. Warden (from DA2 page 4: warden_id, warden_name, warden_email, warden_phone, block_id)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS warden (
        warden_id INTEGER PRIMARY KEY,
        warden_name TEXT NOT NULL,
        warden_email TEXT NOT NULL,
        warden_phone TEXT NOT NULL,
        block_id INTEGER,
        FOREIGN KEY (block_id) REFERENCES block(block_id) ON DELETE SET NULL
    );
    """)

    # 6. Staff (from DA2 page 4: staff_id, staff_name, staff_designation, staff_gender, join_date, hostel_id)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS staff (
        staff_id INTEGER PRIMARY KEY,
        staff_name TEXT NOT NULL,
        staff_designation TEXT NOT NULL,
        staff_gender TEXT NOT NULL,
        join_date TEXT NOT NULL,
        hostel_id INTEGER,
        FOREIGN KEY (hostel_id) REFERENCES hostel(hostel_id) ON DELETE SET NULL
    );
    """)

    # 7. Room Allocation (from DA2 page 5: alloc_id, room_id, student_id, date_from, date_to, status)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS room_allocation (
        alloc_id INTEGER PRIMARY KEY,
        room_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        date_from TEXT NOT NULL,
        date_to TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (room_id) REFERENCES room(room_id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE
    );
    """)

    # 8. Payment (from DA2 page 7: payment_id, amount, payment_mode, pay_date, status, staff_id, student_id)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS payment (
        payment_id INTEGER PRIMARY KEY,
        amount REAL NOT NULL,
        payment_mode TEXT NOT NULL,
        pay_date TEXT NOT NULL,
        status TEXT NOT NULL,
        staff_id INTEGER,
        student_id INTEGER NOT NULL,
        receipt_number TEXT,
        payment_type TEXT DEFAULT 'Hostel Fee',
        FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE SET NULL,
        FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE
    );
    """)

    # 9. Complaint (from DA2 page 6: complaint_id, category, description, status, raised_date, student_id)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS complaint (
        complaint_id INTEGER PRIMARY KEY,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL,
        raised_date TEXT NOT NULL,
        student_id INTEGER NOT NULL,
        priority TEXT DEFAULT 'Medium',
        handled_by INTEGER,
        FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE,
        FOREIGN KEY (handled_by) REFERENCES staff(staff_id) ON DELETE SET NULL
    );
    """)

    # 10. Emergency Contact (from DA2 page 6: contact_id, name, phone, relation, student_id)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS emergency_contact (
        contact_id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        relation TEXT NOT NULL,
        student_id INTEGER NOT NULL,
        FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE
    );
    """)

    # 11. Visitor (from DA2 page 6: visitor_id, name, id_proof, visit_time, purpose, student_id)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS visitor (
        visitor_id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        id_proof TEXT NOT NULL,
        visit_time TEXT NOT NULL,
        purpose TEXT NOT NULL,
        student_id INTEGER NOT NULL,
        approved_by INTEGER,
        FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES staff(staff_id) ON DELETE SET NULL
    );
    """)

    # 12. Maintenance Request (from DA2 page 7: request_id, issue_type, description, status, raised_date, room_id)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS maintenance_request (
        request_id INTEGER PRIMARY KEY,
        issue_type TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL,
        raised_date TEXT NOT NULL,
        room_id INTEGER NOT NULL,
        priority TEXT DEFAULT 'Medium',
        assigned_staff INTEGER,
        FOREIGN KEY (room_id) REFERENCES room(room_id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_staff) REFERENCES staff(staff_id) ON DELETE SET NULL
    );
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database schema successfully created from DA-2 & DA-3 PDF specification.")
