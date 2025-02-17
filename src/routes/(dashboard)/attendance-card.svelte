<script lang="ts">
	import { routes } from "$lib/constants";
	import { cutePercent, safeDivision } from "$lib/helpers";
	import type { PageData } from "./$types";

	let { attendanceData }: { attendanceData: Awaited<PageData["details"]>["attendance"] } = $props();

	const percent = cutePercent(safeDivision(attendanceData.attended, attendanceData.total) * 100);
</script>

<a href={routes.attendance}>
	<div class="flex flex-col gap-4 rounded-lg border bg-primary-foreground p-6 text-right">
		<div>
			<div class="text-5xl">{percent} %</div>
			<div class="text-4xl">attendance</div>
		</div>
		<div class="text-sm">See details &rarr;</div>
	</div>
</a>
