<script>
	let { children } = $props();
</script>

<div class="min-h-screen">
	<div class="mx-auto flex h-screen max-w-screen-md flex-col overflow-y-scroll">
		{@render children?.()}
	</div>
</div>
