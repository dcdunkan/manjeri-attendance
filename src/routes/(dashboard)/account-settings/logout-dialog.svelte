<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import * as Dialog from "$lib/components/ui/dialog";
	import { toast } from "svelte-sonner";
	import type { AccountSession } from "./types";
	import type { Result } from "$lib/types";
	import { SESSION_MODIFY_RESTRICTION_PERIOD } from "$lib/constants";
	import { LoaderCircleIcon } from "lucide-svelte";

	let {
		open = $bindable(),
		session,
		sessions = $bindable(),
		canModifyOtherSessions,
	}: {
		open: boolean;
		session: AccountSession;
		sessions: AccountSession[];
		canModifyOtherSessions: boolean;
	} = $props();

	let isLoggingOut = $state(false);
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Logout the session?</Dialog.Title>
			<Dialog.Description>
				{session.deviceInfo || "Unknown device"}
			</Dialog.Description>
		</Dialog.Header>

		<Dialog.Footer class="gap-y-2">
			<Button
				variant="destructive"
				disabled={!canModifyOtherSessions || isLoggingOut}
				onclick={async () => {
					if (!canModifyOtherSessions) return;
					if (isLoggingOut) return;

					isLoggingOut = true;

					const searchParams = new URLSearchParams({ sessionId: session.id.toString() });
					const response = await fetch(`/api/student/account/session?${searchParams}`, {
						method: "DELETE",
					});
					if (!response.ok && response.status !== 400) {
						isLoggingOut = false;
						toast.error("Failed logout the device.");
						return;
					}
					const result: Result<boolean> = await response.json();
					if (!result.ok) {
						isLoggingOut = false;
						toast.error(result.reason);
						return;
					}

					isLoggingOut = true;

					const sessionIndex = sessions.findIndex((s) => s.id === session.id);
					if (sessionIndex != -1) sessions.splice(sessionIndex, 1);
					open = false;
				}}
			>
				{#if isLoggingOut}
					<LoaderCircleIcon class="animate-spin" /> Logging out...
				{:else}
					Logout
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
