// Authentication Types
export interface User {
  id: number;
  name: string;
  email: string;
  role: "WORKER" | "MANAGER";
}

// Backend response format (what we actually receive)
export interface BackendAuthResponse {
  token: string;
  role: "WORKER" | "MANAGER";
  // The backend seems to include user info directly, not nested
}

// Frontend expected format
export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: "WORKER" | "MANAGER";
}

// Incident Types
export type IncidentStatus = 
  | "OPEN" 
  | "IN_PROGRESS" 
  | "UNDER_REVIEW" 
  | "RESOLVED" 
  | "CLOSED" 
  | "CANCELLED";

export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface IncidentListItem {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  latitude?: number;
  longitude?: number;
  locationDescription?: string;
  imageUrls: string[];
  audioUrls: string[];
  reportedBy: string;
  reportedByEmail: string;
  assignedTo?: string;
  assignedToEmail?: string;
  reportedAt: string;
  updatedAt?: string;
  updatedBy?: string;
  rcaReport?: RcaReport;
  rcaAiSuggestions?: RcaAiSuggestions;
  aiSuggestions: string[];
  imageTags: string[];
  transcriptions: string[];
}

export interface IncidentDetail extends IncidentListItem {}

export interface CreateIncidentRequest {
  title: string;
  description: string;
  severity: IncidentSeverity;
  latitude?: number;
  longitude?: number;
  locationDescription?: string;
  imageUrls?: string[];
  audioUrls?: string[];
}

export interface UpdateIncidentRequest extends CreateIncidentRequest {}

// Pagination Types
export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: {
    sorted: boolean;
    ascending: boolean;
  };
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: Pageable;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

export type IncidentListResponse = PaginatedResponse<IncidentListItem>;

// File Upload Types
export interface PresignedUploadResponse {
  uploadUrl: string;
  fileUrl: string;
  expiresInSeconds: number;
}

export interface PresignedDownloadResponse {
  downloadUrl: string;
  expiresInSeconds: number;
}

// Image Analysis Types
export interface ImageAnalysisRequest {
  imageUrl: string;
  incidentId: string;
}

export interface ImageAnalysisResponse {
  imageUrl: string;
  tags: string[];
  confidenceScore: number;
  processed: boolean;
  processedAt: string;
}

export interface ImageAnalysisStatus {
  status: string;
  apiEnabled: boolean;
  lastSuccessfulCall: string;
  errorCount: number;
}

// RCA Types
export interface RcaReport {
  id: number;
  fiveWhys: string;
  correctiveAction: string;
  preventiveAction: string;
  createdAt: string;
  manager: User;
}

export interface RcaAiSuggestions {
  id?: string;
  incidentId: string;
  incidentTitle: string;
  suggestedFiveWhys: string;
  suggestedCorrectiveAction: string;
  suggestedPreventiveAction: string;
  incidentCategory: string;
  status: "GENERATED" | "REVIEWED" | "APPROVED";
  generatedAt: string;
  reviewedAt?: string;
  reviewedByName?: string;
  errorMessage?: string;
}

export interface CreateRcaReportRequest {
  fiveWhys: string;
  correctiveAction: string;
  preventiveAction: string;
}

// Metrics Types
export interface MetricsSummary {
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  totalUsers: number;
  activeWorkers: number;
  totalManagers: number;
  averageResolutionTimeHours: number;
  incidentsByStatus: Record<IncidentStatus, number>;
  incidentsBySeverity: Record<IncidentSeverity, number>;
}

export interface RcaStatistics {
  totalSuggestions: number;
  generatedCount: number;
  reviewedCount: number;
  approvedCount: number;
  modifiedCount: number;
  failedCount: number;
  successRate: number;
  averageProcessingTimeMs: number;
  averageTokenUsage: number;
}

// Error Types
export interface ValidationErrors {
  [key: string]: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  validationErrors?: ValidationErrors;
}

export interface RateLimitError {
  error: string;
  message: string;
  remaining: number;
  retryAfterSeconds: number;
}

// Query Parameters
export interface IncidentQueryParams {
  page?: number;
  size?: number;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  search?: string;
}
