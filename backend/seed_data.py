"""
HostelOS Exact Dataset Seeder — BACSE202 DA-2 & DA-3 Oracle Database
Author: Jyotish N (Reg No: 25BAI1176)
VIT Chennai — College Hostel Management System
"""

from database import get_connection, init_db

def seed():
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    print("Seeding exact records from BACSE202 DA2 & DA3 PDFs...")

    # 1. Hostel (from DA2 page 10)
    hostels = [
        (1, 'Ganga Hostel', 'Girls', 'VIT Chennai', 200),
        (2, 'Yamuna Hostel', 'Girls', 'VIT Chennai', 180),
        (3, 'Cauvery Hostel', 'Boys', 'VIT Chennai', 220)
    ]
    cursor.executemany(
        "INSERT INTO hostel (hostel_id, hostel_name, type, address, capacity) VALUES (?, ?, ?, ?, ?)",
        hostels
    )

    # 2. Block (from DA2 page 11)
    blocks = [
        (101, 'Ganga-A', 1, 1),
        (102, 'Ganga-B', 2, 1),
        (201, 'Yamuna-A', 1, 2),
        (301, 'Cauvery-A', 1, 3)
    ]
    cursor.executemany(
        "INSERT INTO block (block_id, block_name, floor, hostel_id) VALUES (?, ?, ?, ?)",
        blocks
    )

    # 3. Room (from DA2 page 11)
    # A101 (Single, 1, Occupied, 101)
    # A102 (Double, 1, Occupied, 101)
    # A103 (Double, 1, Available, 101)
    # B201 (Single, 2, Occupied, 102)
    # C101 (Double, 1, Available, 201)
    # D101 (Single, 1, Occupied, 301)
    rooms = [
        (1001, 'A101', 'Single', 1, 'Occupied', 101, 1, 1),
        (1002, 'A102', 'Double', 1, 'Occupied', 101, 2, 2),
        (1003, 'A103', 'Double', 1, 'Available', 101, 2, 0),
        (2001, 'B201', 'Single', 2, 'Occupied', 102, 1, 1),
        (3001, 'C101', 'Double', 1, 'Available', 201, 2, 0),
        (4001, 'D101', 'Single', 1, 'Occupied', 301, 2, 2)
    ]
    cursor.executemany(
        "INSERT INTO room (room_id, room_no, type, floor_no, status, block_id, capacity, current_occupancy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        rooms
    )

    # 4. Student (from DA2 page 12)
    students = [
        (1150, 'Janani', 'Female', '2007-05-12', 'B.Tech AI', 1, '9876543210', '25BAI1150', 'janani@vitstudent.ac.in'),
        (1151, 'Priya', 'Female', '2007-08-20', 'B.Tech CSE', 1, '9876543211', '25BCE1151', 'priya@vitstudent.ac.in'),
        (1152, 'Harini', 'Female', '2006-11-15', 'B.Tech IT', 2, '9876543212', '24BIT1152', 'harini@vitstudent.ac.in'),
        (1153, 'Divya', 'Female', '2007-02-10', 'B.Tech ECE', 1, '9876543213', '25BEC1153', 'divya@vitstudent.ac.in'),
        (1154, 'Arun', 'Male', '2006-07-25', 'B.Tech CSE', 2, '9876543214', '24BCE1154', 'arun@vitstudent.ac.in'),
        (1155, 'Karthik', 'Male', '2007-01-18', 'B.Tech AI', 1, '9876543215', '25BAI1155', 'karthik@vitstudent.ac.in'),
        (1156, 'Sneha', 'Female', '2006-09-30', 'B.Tech CSE', 2, '9876543216', '24BCE1156', 'sneha@vitstudent.ac.in'),
        (1157, 'Rahul', 'Male', '2007-03-14', 'B.Tech IT', 1, '9876543217', '25BIT1157', 'rahul@vitstudent.ac.in')
    ]
    cursor.executemany(
        """INSERT INTO student (student_id, student_name, gender, dob, course, year, phone, reg_no, email)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        students
    )

    # 5. Warden (from DA2 page 12)
    wardens = [
        (501, 'Lakshmi', 'lakshmi@vit.ac.in', '9000000001', 101),
        (502, 'Meena', 'meena@vit.ac.in', '9000000002', 102),
        (503, 'Suresh', 'suresh@vit.ac.in', '9000000003', 301)
    ]
    cursor.executemany(
        "INSERT INTO warden (warden_id, warden_name, warden_email, warden_phone, block_id) VALUES (?, ?, ?, ?, ?)",
        wardens
    )

    # 6. Staff (from DA2 page 13)
    staff = [
        (601, 'Ravi', 'Security', 'Male', '2024-06-10', 1),
        (602, 'Anitha', 'Cleaner', 'Female', '2023-07-15', 1),
        (603, 'Mohan', 'Maintenance', 'Male', '2024-01-20', 2),
        (604, 'Priya', 'Security', 'Female', '2023-09-05', 3)
    ]
    cursor.executemany(
        "INSERT INTO staff (staff_id, staff_name, staff_designation, staff_gender, join_date, hostel_id) VALUES (?, ?, ?, ?, ?, ?)",
        staff
    )

    # 7. Room Allocation (from DA2 page 13)
    allocations = [
        (701, 1001, 1150, '2026-07-01', '2027-06-30', 'Active'),
        (702, 1002, 1151, '2026-07-01', '2027-06-30', 'Active'),
        (703, 2001, 1152, '2026-07-01', '2027-06-30', 'Active'),
        (704, 1002, 1153, '2026-07-01', '2027-06-30', 'Active'),
        (705, 4001, 1154, '2026-07-01', '2027-06-30', 'Active'),
        (706, 4001, 1155, '2026-07-01', '2027-06-30', 'Active')
    ]
    cursor.executemany(
        "INSERT INTO room_allocation (alloc_id, room_id, student_id, date_from, date_to, status) VALUES (?, ?, ?, ?, ?, ?)",
        allocations
    )

    # 8. Payment (from DA2 page 14)
    payments = [
        (801, 45000.0, 'Online', '2026-07-05', 'Paid', 601, 1150, 'REC-801', 'Hostel Fee'),
        (802, 45000.0, 'UPI', '2026-07-06', 'Paid', 601, 1151, 'REC-802', 'Hostel Fee'),
        (803, 42000.0, 'Online', '2026-07-07', 'Paid', 602, 1152, 'REC-803', 'Hostel Fee'),
        (804, 45000.0, 'Cash', '2026-07-08', 'Pending', 602, 1153, 'REC-804', 'Hostel Fee'),
        (805, 42000.0, 'UPI', '2026-07-09', 'Paid', 603, 1154, 'REC-805', 'Hostel Fee'),
        (806, 42000.0, 'Online', '2026-07-10', 'Paid', 603, 1155, 'REC-806', 'Hostel Fee')
    ]
    cursor.executemany(
        """INSERT INTO payment (payment_id, amount, payment_mode, pay_date, status, staff_id, student_id, receipt_number, payment_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        payments
    )

    # 9. Complaint (from DA2 page 14)
    complaints = [
        (901, 'Electrical', 'Fan is not working', 'Pending', '2026-08-01', 1150, 'Medium', 603),
        (902, 'Water', 'Water supply problem', 'Resolved', '2026-08-03', 1151, 'High', 602),
        (903, 'Internet', 'WiFi connection is slow', 'Pending', '2026-08-05', 1152, 'Low', 601),
        (904, 'Cleaning', 'Room cleaning required', 'Resolved', '2026-08-07', 1153, 'Low', 602)
    ]
    cursor.executemany(
        """INSERT INTO complaint (complaint_id, category, description, status, raised_date, student_id, priority, handled_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        complaints
    )

    # 10. Emergency Contact (from DA2 page 15)
    contacts = [
        (1001, 'JYOTHISH', '9888888801', 'Father', 1150),
        (1002, 'JESSICA', '9888888802', 'Mother', 1151),
        (1003, 'Ramesh', '9888888803', 'Father', 1152),
        (1004, 'JANANI', '9888888804', 'Mother', 1153),
        (1005, 'Kumar', '9888888805', 'Father', 1154)
    ]
    cursor.executemany(
        "INSERT INTO emergency_contact (contact_id, name, phone, relation, student_id) VALUES (?, ?, ?, ?, ?)",
        contacts
    )

    # 11. Visitor (from DA2 page 15)
    visitors = [
        (1101, 'Suresh Kumar', 'ID1001', '2026-08-10 10:30:00', 'Meet Student', 1150, 601),
        (1102, 'Priya Devi', 'ID1002', '2026-08-11 11:00:00', 'Meet Student', 1151, 601),
        (1103, 'Ramesh', 'ID1003', '2026-08-12 14:30:00', 'Meet Student', 1152, 602),
        (1104, 'Anitha', 'ID1004', '2026-08-13 16:00:00', 'Meet Student', 1153, 602)
    ]
    cursor.executemany(
        "INSERT INTO visitor (visitor_id, name, id_proof, visit_time, purpose, student_id, approved_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
        visitors
    )

    # 12. Maintenance Request (from DA2 page 15)
    maintenance = [
        (1201, 'Electrical', 'Fan repair required', 'Pending', '2026-08-10', 1001, 'Medium', 603),
        (1202, 'Plumbing', 'Tap leakage', 'Resolved', '2026-08-11', 1002, 'High', 602),
        (1203, 'Internet', 'WiFi router issue', 'Pending', '2026-08-12', 2001, 'Medium', 601),
        (1204, 'Furniture', 'Chair replacement required', 'Resolved', '2026-08-13', 1002, 'Low', 603)
    ]
    cursor.executemany(
        """INSERT INTO maintenance_request (request_id, issue_type, description, status, raised_date, room_id, priority, assigned_staff)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        maintenance
    )

    conn.commit()
    conn.close()
    print("Exact dataset from DA-2 and DA-3 seeded successfully!")

if __name__ == "__main__":
    seed()
