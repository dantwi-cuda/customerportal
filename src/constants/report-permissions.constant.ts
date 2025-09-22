// Report Management Permissions

// Basic report permissions
export const REPORT_ALL = 'report.all'
export const REPORT_READ = 'report.read'
export const REPORT_LAUNCH = 'report.launch'
export const REPORT_CREATE = 'report.create'
export const REPORT_UPDATE = 'report.update'
export const REPORT_DELETE = 'report.delete'
export const REPORT_APPROVE = 'report.approve'

// Report-specific permissions
export const PIN_REPORTS = 'pin_reports'

// Convenience arrays for common permission groups
export const ALL_REPORT_READ_PERMISSIONS = [
    REPORT_ALL,
    REPORT_READ,
    REPORT_LAUNCH,
]

export const ALL_REPORT_MANAGEMENT_PERMISSIONS = [
    REPORT_ALL,
    REPORT_READ,
    REPORT_LAUNCH,
    REPORT_CREATE,
    REPORT_UPDATE,
    REPORT_DELETE,
    REPORT_APPROVE,
    PIN_REPORTS,
]
