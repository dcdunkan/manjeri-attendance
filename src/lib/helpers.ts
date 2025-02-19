import type { BaseDate } from "$lib/types";

const formatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
export const longDateFormatter = new Intl.DateTimeFormat("en-US", {
	weekday: "long",
	day: "2-digit",
	month: "long",
	year: "numeric",
});

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
