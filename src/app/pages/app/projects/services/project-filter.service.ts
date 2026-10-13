import { Injectable } from '@angular/core';
import { Project, Filter, FilterCondition, GroupBy, Sort } from '../models';

/**
 * Project Filter Service - Handles filtering, grouping, and sorting
 */
@Injectable({
  providedIn: 'root'
})
export class ProjectFilterService {

  /**
   * Apply filters to projects list
   */
  applyFilters(projects: Project[], filters: Filter[]): Project[] {
    if (!filters || filters.length === 0) {
      return projects;
    }

    return projects.filter(project => {
      return filters.every(filter => this.matchesFilter(project, filter));
    });
  }

  /**
   * Check if project matches a single filter
   */
  private matchesFilter(project: Project, filter: Filter): boolean {
    const value = project.properties[filter.propertyId];

    switch (filter.condition) {
      case FilterCondition.INCLUDES:
        return filter.values.includes(value);

      case FilterCondition.NOT_INCLUDES:
        return !filter.values.includes(value);

      case FilterCondition.IS_EMPTY:
        return value === null || value === undefined || value === '';

      case FilterCondition.IS_NOT_EMPTY:
        return value !== null && value !== undefined && value !== '';

      case FilterCondition.CONTAINS:
        return typeof value === 'string' &&
               value.toLowerCase().includes(filter.values[0]?.toLowerCase());

      case FilterCondition.NOT_CONTAINS:
        return typeof value === 'string' &&
               !value.toLowerCase().includes(filter.values[0]?.toLowerCase());

      case FilterCondition.GREATER_THAN:
        return Number(value) > Number(filter.values[0]);

      case FilterCondition.LESS_THAN:
        return Number(value) < Number(filter.values[0]);

      case FilterCondition.EQUALS:
        return value === filter.values[0];

      case FilterCondition.NOT_EQUALS:
        return value !== filter.values[0];

      case FilterCondition.DATE_RANGE:
        if (!value || filter.values.length < 2) return false;
        const date = new Date(value);
        const start = new Date(filter.values[0]);
        const end = new Date(filter.values[1]);
        return date >= start && date <= end;

      default:
        return true;
    }
  }

  /**
   * Apply grouping to projects
   */
  applyGrouping(projects: Project[], groupBy: GroupBy): Map<string, Project[]> {
    if (!groupBy || groupBy.mode === 'none') {
      return new Map([['All', projects]]);
    }

    const grouped = new Map<string, Project[]>();

    projects.forEach(project => {
      const groupValue = project.properties[groupBy.propertyId] || 'Ungrouped';
      const key = String(groupValue);

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(project);
    });

    return grouped;
  }

  /**
   * Apply sorting to projects
   */
  applySort(projects: Project[], sort: Sort): Project[] {
    if (!sort) {
      return projects;
    }

    return [...projects].sort((a, b) => {
      const aValue = a.properties[sort.propertyId];
      const bValue = b.properties[sort.propertyId];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      let comparison = 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Apply search to projects
   */
  applySearch(projects: Project[], searchTerm: string): Project[] {
    if (!searchTerm || searchTerm.trim() === '') {
      return projects;
    }

    const term = searchTerm.toLowerCase();

    return projects.filter(project => {
      // Search in title
      if (project.title?.toLowerCase().includes(term)) {
        return true;
      }

      // Search in description
      if (project.description?.toLowerCase().includes(term)) {
        return true;
      }

      // Search in properties
      return Object.values(project.properties).some(value => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(term);
      });
    });
  }
}
