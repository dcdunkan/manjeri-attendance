<script lang="ts">
	import "../app.css";
	import { ModeWatcher } from "mode-watcher";
	import { Toaster } from "$lib/components/ui/sonner";

	let { children } = $props();
</script>

<Toaster richColors toastOptions={{ class: "font-sans" }} />
<ModeWatcher />

{@render children?.()}
