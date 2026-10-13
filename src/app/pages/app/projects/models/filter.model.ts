/**
 * Filter condition types
 */
export enum FilterCondition {
  INCLUDES = 'includes',
  NOT_INCLUDES = 'notIncludes',
  IS_EMPTY = 'isEmpty',
  IS_NOT_EMPTY = 'isNotEmpty',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  DATE_RANGE = 'dateRange'
}

/**
 * Filter definition
 */
export interface Filter {
  propertyId: string;
  condition: FilterCondition;
  values: any[];
}

/**
 * Group by configuration
 */
export interface GroupBy {
  propertyId: string;
  mode: 'none' | 'property';
}

/**
 * Sort configuration
 */
export interface Sort {
  propertyId: string;
  direction: 'asc' | 'desc';
}
