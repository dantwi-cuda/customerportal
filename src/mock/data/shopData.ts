export const shopsData = [
    {
        id: 5130,
        name: 'Shop A - Main Store',
        description: 'Main retail store location',
        isActive: true,
        createdOn: '2023-01-15T10:00:00Z',
        modifiedOn: '2023-10-20T14:30:00Z',
        modifiedBy: 'admin'
    },
    {
        id: 5131,
        name: 'Shop B - North Branch',
        description: 'North branch location',
        isActive: true,
        createdOn: '2023-02-01T09:00:00Z',
        modifiedOn: '2023-10-18T16:45:00Z',
        modifiedBy: 'admin'
    },
    {
        id: 5132,
        name: 'Shop C - South Branch',
        description: 'South branch location',
        isActive: true,
        createdOn: '2023-03-10T11:00:00Z',
        modifiedOn: '2023-10-15T12:20:00Z',
        modifiedBy: 'admin'
    }
]

export const shopPropertiesData = [
    {
        id: 1,
        shopId: 5130,
        shopAttributeId: 1,
        attributeName: 'Monthly Revenue',
        attributeCategoryDescription: 'Financial',
        attributeUnitType: 'Currency',
        propertyYear: 2023,
        propertyMonth: 10,
        propertyValue: 125000,
        rowModifiedBy: 'admin',
        rowModifiedOn: '2023-10-20T14:30:00Z'
    },
    {
        id: 2,
        shopId: 5130,
        shopAttributeId: 2,
        attributeName: 'Customer Count',
        attributeCategoryDescription: 'Operations',
        attributeUnitType: 'Count',
        propertyYear: 2023,
        propertyMonth: 10,
        propertyValue: 2450,
        rowModifiedBy: 'admin',
        rowModifiedOn: '2023-10-20T14:30:00Z'
    },
    {
        id: 3,
        shopId: 5130,
        shopAttributeId: 3,
        attributeName: 'Employee Count',
        attributeCategoryDescription: 'HR',
        attributeUnitType: 'Count',
        propertyYear: 2023,
        propertyMonth: 10,
        propertyValue: 15,
        rowModifiedBy: 'admin',
        rowModifiedOn: '2023-10-20T14:30:00Z'
    },
    {
        id: 4,
        shopId: 5130,
        shopAttributeId: 4,
        attributeName: 'Square Footage',
        attributeCategoryDescription: 'Physical',
        attributeUnitType: 'Area',
        propertyYear: 2023,
        propertyMonth: 10,
        propertyValue: 5500,
        rowModifiedBy: 'admin',
        rowModifiedOn: '2023-10-20T14:30:00Z'
    },
    {
        id: 5,
        shopId: 5131,
        shopAttributeId: 1,
        attributeName: 'Monthly Revenue',
        attributeCategoryDescription: 'Financial',
        attributeUnitType: 'Currency',
        propertyYear: 2023,
        propertyMonth: 10,
        propertyValue: 98000,
        rowModifiedBy: 'admin',
        rowModifiedOn: '2023-10-18T16:45:00Z'
    }
]
