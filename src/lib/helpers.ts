export function safeDivision(numerator: number, denominator: number) {
	return denominator == 0 ? 0 : numerator / denominator;
}
