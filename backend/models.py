"""
Pydantic Request & Response Models for HostelOS API
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List

class StudentCreate(BaseModel):
    reg_no: str = Field(..., alias="regNo")
    name: str
    gender: str
    dob: str
    department: str
    year: int
    contact_number: str = Field(..., alias="contactNumber")
    email: str
    admission_date: str = Field(..., alias="admissionDate")

    class Config:
        populate_by_name = True

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    contact_number: Optional[str] = Field(None, alias="contactNumber")
    email: Optional[str] = None

    class Config:
        populate_by_name = True

class HostelCreate(BaseModel):
    name: str
    type: str
    total_capacity: int = Field(..., alias="totalCapacity")
    warden_id: Optional[int] = Field(None, alias="wardenId")

    class Config:
        populate_by_name = True

class BlockCreate(BaseModel):
    name: str
    hostel_id: int = Field(..., alias="hostelId")
    total_floors: int = Field(..., alias="totalFloors")

    class Config:
        populate_by_name = True

class RoomCreate(BaseModel):
    room_number: str = Field(..., alias="roomNumber")
    floor_id: int = Field(..., alias="floorId")
    room_type: str = Field(..., alias="roomType")
    capacity: int
    status: Optional[str] = "Available"

    class Config:
        populate_by_name = True

class RoomUpdate(BaseModel):
    room_number: Optional[str] = Field(None, alias="roomNumber")
    room_type: Optional[str] = Field(None, alias="roomType")
    capacity: Optional[int] = None
    status: Optional[str] = None

    class Config:
        populate_by_name = True

class AllocationCreate(BaseModel):
    student_id: int = Field(..., alias="studentId")
    room_id: int = Field(..., alias="roomId")
    allocation_date: str = Field(..., alias="allocationDate")

    class Config:
        populate_by_name = True

class PaymentCreate(BaseModel):
    student_id: int = Field(..., alias="studentId")
    amount: float
    payment_date: str = Field(..., alias="paymentDate")
    payment_mode: str = Field(..., alias="paymentMode")
    payment_type: str = Field(..., alias="paymentType")
    status: str = "Completed"
    receipt_number: Optional[str] = Field(None, alias="receiptNumber")

    class Config:
        populate_by_name = True

class ComplaintCreate(BaseModel):
    student_id: int = Field(..., alias="studentId")
    room_id: int = Field(..., alias="roomId")
    complaint_type: str = Field(..., alias="complaintType")
    description: str
    priority: str = "Medium"
    date_filed: str = Field(..., alias="dateFiled")

    class Config:
        populate_by_name = True

class ComplaintStatusUpdate(BaseModel):
    status: str
    resolved_date: Optional[str] = Field(None, alias="resolvedDate")
    handled_by: Optional[int] = Field(None, alias="handledBy")

    class Config:
        populate_by_name = True

class MaintenanceCreate(BaseModel):
    room_id: int = Field(..., alias="roomId")
    request_type: str = Field(..., alias="requestType")
    description: str
    priority: str = "Medium"
    date_raised: str = Field(..., alias="dateRaised")
    assigned_staff: Optional[int] = Field(None, alias="assignedStaff")

    class Config:
        populate_by_name = True

class MaintenanceStatusUpdate(BaseModel):
    status: str
    completion_date: Optional[str] = Field(None, alias="completionDate")
    assigned_staff: Optional[int] = Field(None, alias="assignedStaff")

    class Config:
        populate_by_name = True

class VisitorCreate(BaseModel):
    name: str
    contact_number: str = Field(..., alias="contactNumber")
    relation_to_student: str = Field(..., alias="relationToStudent")
    student_id: int = Field(..., alias="studentId")
    visit_date: str = Field(..., alias="visitDate")
    check_in_time: str = Field(..., alias="checkInTime")
    check_out_time: Optional[str] = Field(None, alias="checkOutTime")
    approved_by: Optional[int] = Field(None, alias="approvedBy")

    class Config:
        populate_by_name = True

class StaffCreate(BaseModel):
    name: str
    role: str
    contact_number: str = Field(..., alias="contactNumber")
    shift: str
    hostel_id: Optional[int] = Field(None, alias="hostelId")
    date_of_joining: str = Field(..., alias="dateOfJoining")

    class Config:
        populate_by_name = True

class WardenCreate(BaseModel):
    name: str
    contact_number: str = Field(..., alias="contactNumber")
    email: str
    date_of_joining: str = Field(..., alias="dateOfJoining")

    class Config:
        populate_by_name = True

class EmergencyContactCreate(BaseModel):
    student_id: int = Field(..., alias="studentId")
    name: str
    relationship: str
    phone_number: str = Field(..., alias="phoneNumber")
    alternate_phone: Optional[str] = Field(None, alias="alternatePhone")

    class Config:
        populate_by_name = True
