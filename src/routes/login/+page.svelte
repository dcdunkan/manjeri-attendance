<script lang="ts">
	import type { PageProps } from "./$types";
	import LoginForm from "./login-form.svelte";

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Login</title>
</svelte:head>

<LoginForm data={data.form} />
