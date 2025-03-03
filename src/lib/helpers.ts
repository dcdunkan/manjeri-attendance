import type { BaseDate } from "$lib/types";
import { DAY, HOUR, MINUTE, SECOND } from "$lib/constants";

const formatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
export const longDateFormatter = new Intl.DateTimeFormat("en-US", {
	weekday: "long",
	day: "2-digit",
	month: "long",
	year: "numeric",
});
export const timeFormatter = new Intl.DateTimeFormat("en-US", {
	timeStyle: "short",
});

export function negateFn<T extends unknown[]>(
	fn: (...args: T) => boolean,
): (...args: T) => boolean {
	return (...args: T) => !fn(...args);
}

export function safeDivision(numerator: number, denominator: number) {
	return denominator == 0 ? 0 : numerator / denominator;
}

export function cutePercent(percent: number) {
	return Number.parseFloat(percent.toFixed(2));
}

export function pluralize(count: number, singular: string, plural: string) {
	return count == 1 ? singular : plural;
}

export function isValidDate(date: Date) {
	return date instanceof Date && !isNaN(date.valueOf());
}

export function extractBaseDate(input: Date): BaseDate {
	return {
		year: input.getFullYear(),
		month: input.getMonth(),
		date: input.getDate(), // TODO: rename to `day`
	};
}

export function getWeekday(year: number, month: number, date: number) {
	return formatter.format(new Date(year, month, date));
}

export function isSameDay(a: Date | BaseDate, b: Date | BaseDate) {
	const x = a instanceof Date ? extractBaseDate(a) : a;
	const y = b instanceof Date ? extractBaseDate(b) : b;
	return x.year === y.year && x.month === y.month && x.date === y.date;
}

export function isPast(a: Date | BaseDate, b: Date | BaseDate) {
	const x = a instanceof Date ? extractBaseDate(a) : a;
	const y = b instanceof Date ? extractBaseDate(b) : b;
	return x.year < y.year
		? true
		: x.year === y.year
			? x.month < y.month
				? true
				: x.month === y.month
					? x.date < y.date
						? true
						: false
					: false
			: false;
}

export function generateLoginId(rollNumber: number, batchYear: string) {
	if (isNaN(rollNumber) || rollNumber < 1) return;
	const paddedRollNumber = rollNumber.toString().padStart(3, "0");
	return `${batchYear}${paddedRollNumber}`;
}

export function timeDistance(x: number, y: number) {
	const MONTH = 30 * DAY,
		YEAR = 265 * DAY;

	const diff = Math.floor(Math.abs(x - y)) - 1;

	if (diff < 10 * SECOND) {
		return "just a few seconds";
	} else if (diff < 30 * SECOND) {
		return "less than a minute";
	} else if (diff < MINUTE + 30 * SECOND) {
		return `a minute`;
	} else if (diff < 44 * MINUTE + 30 * SECOND) {
		return `${Math.ceil(diff / MINUTE)} minutes`;
	} else if (diff < 89 * MINUTE + 30 * SECOND) {
		return `an hour`;
	} else if (diff < 23 * HOUR + 59 * MINUTE + 30 * SECOND) {
		return `${Math.ceil(diff / HOUR)} hours`;
	} else if (diff < 41 * HOUR + 59 * MINUTE + 30 * SECOND) {
		return `a day`;
	} else if (diff <= 7 * DAY) {
		return `a week`;
	} else if (diff < 29 * DAY + 23 * HOUR + 59 * MINUTE) {
		return `${Math.ceil(diff / DAY)} days`;
	} else if (diff < 44 * DAY + 23 * HOUR + 59 * MINUTE) {
		return `a month`;
	} else if (diff < 59 * DAY + 23 * HOUR + 59 * MINUTE) {
		return `2 months`;
	} else if (diff < 364 * DAY + 23 * HOUR + 59 * MINUTE) {
		return `${Math.ceil(diff / MONTH)} months`;
	} else if (diff < 1 * YEAR + 3 * MONTH) {
		return `a year`;
	} else if (diff < 1 * YEAR + 9 * MONTH) {
		return `over a year`;
	} else if (diff < 2 * YEAR) {
		return `almost 2 years`;
	} else {
		return `${Math.ceil(diff / YEAR)} years`;
	}
}
