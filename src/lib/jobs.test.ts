import { describe, it, expect } from 'vitest';
import {
    sortByNewest,
    formatPostedDate,
    getDepartments,
    getLocations,
    filterJobs,
    filterJobsByDepartment,
    filterJobsByLocation,
} from './jobs';
import type { Job } from '../types/job';

function makeJob(slug: string, department: string, location: string, postedDate: string): Job {
    return {
        slug,
        title: `Role ${slug}`,
        department,
        location,
        type: 'Full-time',
        remote: true,
        postedDate,
        summary: 'A role.',
    };
}

describe('sortByNewest', () => {
    it('orders jobs by posted date, newest first', () => {
        const jobs = [
            makeJob('a', 'Technology', 'Remote', '2027-01-01'),
            makeJob('b', 'Finance', 'Remote', '2027-03-15'),
            makeJob('c', 'Technology', 'Seattle', '2027-02-10'),
        ];
        expect(sortByNewest(jobs).map((j) => j.slug)).toEqual(['b', 'c', 'a']);
    });

    it('does not mutate the input array', () => {
        const jobs = [
            makeJob('a', 'Technology', 'Remote', '2027-01-01'),
            makeJob('b', 'Finance', 'Remote', '2027-03-15'),
        ];
        const original = jobs.map((j) => j.slug);
        sortByNewest(jobs);
        expect(jobs.map((j) => j.slug)).toEqual(original);
    });
});

describe('formatPostedDate', () => {
    it('formats an ISO date as a readable string', () => {
        expect(formatPostedDate('2027-01-05')).toBe('January 5, 2027');
    });

    it('returns the raw value when the date is unparseable', () => {
        expect(formatPostedDate('not-a-date')).toBe('not-a-date');
    });
});

describe('job filters', () => {
    const jobs = [
        makeJob('a', 'Technology', 'Remote (US & Canada)', '2027-01-01'),
        makeJob('b', 'Finance', 'Remote (US & Canada)', '2027-01-02'),
        makeJob('c', 'Technology', 'Woodinville, WA, USA', '2027-01-03'),
        makeJob('d', 'Research & Development', 'Vancouver, Canada', '2027-01-04'),
    ];

    it('lists department options from the current job postings', () => {
        expect(getDepartments(jobs)).toEqual([
            'Finance',
            'Research & Development',
            'Technology',
        ]);
    });

    it('lists location options from the current job postings', () => {
        expect(getLocations(jobs)).toEqual([
            'Remote (US & Canada)',
            'Vancouver, Canada',
            'Woodinville, WA, USA',
        ]);
    });

    it('filters jobs by department only', () => {
        expect(filterJobsByDepartment(jobs, 'Technology').map((job) => job.slug)).toEqual([ 'a', 'c' ]);
    });

    it('filters jobs by location only', () => {
        expect(filterJobsByLocation(jobs, 'Remote (US & Canada)').map((job) => job.slug)).toEqual([
            'a',
            'b',
        ]);
    });

    it('combines department and location filters together', () => {
        expect(filterJobs(jobs, { department: 'Technology', location: 'Remote (US & Canada)' }).map((job) => job.slug)).toEqual(['a']);
    });

    it('resets to the full list when no filters are active', () => {
        expect(filterJobs(jobs, { department: '', location: '' }).map((job) => job.slug)).toEqual([
            'a',
            'b',
            'c',
            'd',
        ]);
    });

    it('returns no matches when filters do not overlap', () => {
        expect(filterJobs(jobs, { department: 'Technology', location: 'Vancouver, Canada' })).toEqual([]);
    });
});
