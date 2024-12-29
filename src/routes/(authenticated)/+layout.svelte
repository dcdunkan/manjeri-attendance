<script>
	let { children } = $props();
</script>

<div class="mx-auto flex max-w-screen-lg flex-col space-y-6 p-8 pt-12">
	{@render children?.()}
</div>
