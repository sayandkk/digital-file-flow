// ── Enums ─────────────────────────────────────────────────────────────────────
export type Role = 'ADMIN' | 'OFFICER' | 'ASSISTANT' | 'SUPERVISOR' | 'DEPT_HEAD';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type FileStatus = 'PENDING' | 'APPROVED' | 'RETURNED' | 'REJECTED' | 'FORWARDED' | 'CLOSED' | 'ARCHIVED' | 'DISPOSED';
export type NoteType = 'DRAFT' | 'APPROVED';
export type InwardType = 'LETTER' | 'MEMO' | 'REPORT' | 'APPLICATION' | 'OTHER';
export type MovementAction = 'CREATE' | 'FORWARD' | 'APPROVE' | 'RETURN' | 'REJECT' | 'CLOSE' | 'ARCHIVE' | 'RESTORE' | 'DISPOSE';
export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

// ── Core Entities ─────────────────────────────────────────────────────────────
export interface Department {
    id: string;
    name: string;
    code: string;
    description?: string;
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    status: UserStatus;
    designation?: string;
    employeeId?: string;
    department?: Department;
    departmentId?: string;
    lastLoginAt?: string;
    createdAt?: string;
}

export interface Classification {
    id: string;
    name: string;
    type: 'NORMAL' | 'CUSTOM';
    description?: string;
}

export interface FileRecord {
    id: string;
    fileNumber: string;
    subject: string;
    description?: string;
    classification?: Classification;
    classificationId?: string;
    workflowCategory?: WorkflowCategory;
    workflowCategoryId?: string;
    currentStage?: WorkflowStage;
    currentStageId?: string;
    status: FileStatus;
    department?: Department;
    departmentId?: string;
    createdBy?: User;
    createdById?: string;
    currentOwner?: User;
    currentOwnerId?: string;
    approvals?: FileApproval[];
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
    confidentiality?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'SECRET';
    category?: 'FINANCE' | 'HR' | 'LEGAL' | 'OPERATIONS' | 'IT' | 'PROCUREMENT' | 'ADMIN' | 'CUSTOMER_SERVICE' | 'PROJECT' | 'OTHER';
    tags?: string[];
    dueDate?: string;
    slaHours?: number;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface WorkflowCategory {
    id: string;
    name: string;
    description?: string;
    stages?: WorkflowStage[];
    createdAt: string;
}

export interface WorkflowStage {
    id: string;
    categoryId: string;
    role: Role;
    stageOrder: number;
    isMandatory: boolean;
    createdAt: string;
}

export interface FileApproval {
    id: string;
    fileId: string;
    stageId: string;
    stage?: WorkflowStage;
    approvedByUserId?: string;
    approvedBy?: User;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
    comments?: string;
    actionDate?: string;
    createdAt: string;
}

export interface FileMovement {
    id: string;
    fileId: string;
    fromUser?: User;
    fromUserId?: string;
    toUser?: User;
    toUserId?: string;
    action: MovementAction;
    remarks?: string;
    createdAt: string;
}

export interface Inward {
    id: string;
    inwardNumber: string;
    subject: string;
    source?: string;
    type: InwardType;
    priority: Priority;
    description?: string;
    receivedDate: string;
    file?: FileRecord;
    fileId?: string;
    createdBy?: User;
    createdAt: string;
}

export interface Note {
    id: string;
    content: string;
    type: NoteType;
    version: number;
    file?: FileRecord;
    fileId?: string;
    author?: User;
    authorId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Document {
    id: string;
    name: string;
    originalName: string;
    mimeType: string;
    size: number;
    version: number;
    description?: string;
    tags?: string[];
    isReference: boolean;
    file?: FileRecord;
    fileId?: string;
    uploadedBy?: User;
    uploadedById?: string;
    createdAt: string;
    heading?: string;
}

export type RequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED';

export type RequestType =
  | 'IT_SUPPORT'
  | 'PURCHASE_REQUEST'
  | 'HR_REQUEST'
  | 'LEAVE_REQUEST'
  | 'LEGAL_CASE'
  | 'CUSTOMER_COMPLAINT'
  | 'PROJECT_PROPOSAL'
  | 'INVOICE_APPROVAL'
  | 'CONTRACT_REVIEW'
  | 'GENERAL_REQUEST'
  | 'OTHER';

export interface RequestRecord {
  id: string;
  requestNumber: string;
  title: string;
  description: string;
  requestType: RequestType;
  status: RequestStatus;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
  confidentiality:
    | 'PUBLIC'
    | 'INTERNAL'
    | 'CONFIDENTIAL'
    | 'RESTRICTED'
    | 'SECRET';
  category:
    | 'FINANCE'
    | 'HR'
    | 'LEGAL'
    | 'OPERATIONS'
    | 'IT'
    | 'PROCUREMENT'
    | 'ADMIN'
    | 'CUSTOMER_SERVICE'
    | 'PROJECT'
    | 'OTHER';
  createdAt: string;
  createdBy?: User;
}
