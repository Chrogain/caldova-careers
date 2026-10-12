/**
 * Pure, side-effect-free helpers for working with job postings.
 *
 * These operate on plain `Job[]` arrays (already loaded from the content
 * collection by the calling page) so they can be unit tested without the Astro
 * content runtime or a database.
 */
import type { Job } from '../types/job';

export interface JobFilters {
    department?: string;
    location?: string;
}

/** Return jobs sorted by posted date, newest first (does not mutate input). */
export function sortByNewest(jobs: Job[]): Job[] {
    return [...jobs].sort(
        (a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime(),
    );
}

/**
 * Format an ISO-8601 date as a human-readable posted date,
 * e.g. "January 5, 2027". Falls back to the raw value if unparseable.
 */
export function formatPostedDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return iso;
    }
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    });
}

/** Return unique department names from a set of jobs, sorted alphabetically. */
export function getDepartments(jobs: Job[]): string[] {
    return Array.from(new Set(jobs.map((job) => job.department)))
        .filter((department) => department.trim().length > 0)
        .sort((a, b) => a.localeCompare(b));
}

/** Return unique locations from a set of jobs, sorted alphabetically. */
export function getLocations(jobs: Job[]): string[] {
    return Array.from(new Set(jobs.map((job) => job.location)))
        .filter((location) => location.trim().length > 0)
        .sort((a, b) => a.localeCompare(b));
}

/** Filter jobs by department, location, or both. */
export function filterJobs(
    jobs: Job[],
    departmentOrFilters: string | JobFilters = '',
    location: string = '',
): Job[] {
    const filters: JobFilters =
        typeof departmentOrFilters === 'string'
            ? { department: departmentOrFilters, location }
            : departmentOrFilters;

    const resolvedDepartment = filters.department ?? '';
    const resolvedLocation = filters.location ?? '';

    return jobs.filter((job) => {
        const matchesDepartment = !resolvedDepartment || job.department === resolvedDepartment;
        const matchesLocation = !resolvedLocation || job.location === resolvedLocation;
        return matchesDepartment && matchesLocation;
    });
}

/** Filter jobs by department only. */
export function filterJobsByDepartment(jobs: Job[], department: string = ''): Job[] {
    return filterJobs(jobs, { department });
}

/** Filter jobs by location only. */
export function filterJobsByLocation(jobs: Job[], location: string = ''): Job[] {
    return filterJobs(jobs, { location });
}
