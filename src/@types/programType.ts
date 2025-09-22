// Types for Program Type management

export interface ProgramTypeAttribute {
    attributeID: number
    programTypeID: number
    attributeName: string
    attributeType: string
    attributeDescription?: string
    dataType: string
    isRequired: boolean
    defaultValue: string
    description: string
    dataSource?: string
    validationRules?: string
    isActive: boolean
    createdAt: string
}

export interface ProgramType {
    programTypeID: number
    typeName: string
    typeDescription: string
    isActive: boolean
    createdAt: string
    attributes: ProgramTypeAttribute[]
}

export interface CreateProgramTypeRequest {
    typeName: string
    typeDescription: string
    isActive: boolean
    attributes?: CreateProgramTypeAttributeRequest[]
}

export interface UpdateProgramTypeRequest {
    typeName: string
    typeDescription: string
    isActive: boolean
    attributes?: UpdateProgramTypeAttributeRequest[]
}

export interface CreateProgramTypeAttributeRequest {
    programTypeID?: number
    attributeName: string
    attributeType: string
    attributeDescription?: string
    dataType: string
    isRequired: boolean
    defaultValue: string
    description: string
    dataSource?: string
    validationRules?: string
    isActive: boolean
}

export interface UpdateProgramTypeAttributeRequest {
    attributeName: string
    attributeType: string
    attributeDescription?: string
    dataType: string
    isRequired: boolean
    defaultValue: string
    description: string
    dataSource?: string
    validationRules?: string
    isActive: boolean
}
