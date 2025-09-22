// Types for Program Category management

export interface ProgramCategory {
    programCategoryID: number
    categoryName: string
    categoryDescription: string
    isActive: boolean
    createdAt: string
    updatedAt: string
    programCount: number
}

export interface CreateProgramCategoryRequest {
    categoryName: string
    categoryDescription: string
    isActive: boolean
}

export interface UpdateProgramCategoryRequest {
    categoryName: string
    categoryDescription: string
    isActive: boolean
}

export interface ProgramCategoryForm {
    categoryName: string
    categoryDescription: string
    isActive: boolean
}

export interface ProgramCategoryListResponse {
    data: ProgramCategory[]
    totalCount: number
    pageIndex: number
    pageSize: number
    totalPages: number
}
