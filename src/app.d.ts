// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			account: import("$lib/server/auth").SessionValidationResult["account"];
			session: import("$lib/server/auth").SessionValidationResult["session"];
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
