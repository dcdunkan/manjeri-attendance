export const ACCOUNT_ROLES = ["administrator", "student"] as const;
export const DEVICE_TYPES = ["laptop", "mobile", "unknown"] as const;

export const MAX_SESSIONS_PER_ACCOUNT: {
	[role in (typeof ACCOUNT_ROLES)[number]]: number;
} = {
	administrator: 2,
	student: 4,
};

export const SECOND = 1 * 1000,
	MINUTE = 60 * SECOND,
	HOUR = 60 * MINUTE,
	DAY = 24 * HOUR;

// Expires the stored session, invalidating the login
export const SESSION_EXPIRATION_PERIOD = 30 * DAY;
// Renews the stored session, once it reaches this time period since the last renewal
export const SESSION_RENEW_PERIOD = 15 * DAY;
// `lastActive` is only updated if the time passed since the last lastActive.
export const SESSION_LAST_ACTIVE_UPDATE_FREEZE_PERIOD = 3 * MINUTE;
// You can't modify other sessions while you're logged in and right in this period
export const SESSION_MODIFY_RESTRICTION_PERIOD = 24 * HOUR;

// NOT ALL ROUTES ARE LISTED HERE.
export const routes = {
	login: "/login",
	logout: "/logout",

	// administrator
	administrator: "/admin",

	// student & representative
	dashboard: "/",
	attendance: "/attendance",
	accountSettings: "/account-settings",

	// representative
	updateAttendance: "/update-attendance",

	// api
	api: "/api/",
	// api: admin
	adminApis: "/api/admin/",
	// api: representative
	representativeApis: "/api/representative/",
	// api: students
	studentApis: "/api/student/",
};

export const STARTING_YEAR = 2025;

export const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];
