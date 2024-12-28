<script lang="ts">
	import * as Carousel from "$lib/components/ui/carousel";
	import AutoPlayPlugin from "embla-carousel-autoplay";

	const SECOND_IN_MS = 1000;
</script>

<Carousel.Root
	opts={{ loop: true }}
	plugins={[
		AutoPlayPlugin({
			delay: 4 * SECOND_IN_MS,
			stopOnMouseEnter: true,
			stopOnInteraction: false,
		}),
	]}
>
	<Carousel.Content>
		<Carousel.Item>
			<div class="border-2">1</div>
		</Carousel.Item>
	</Carousel.Content>
</Carousel.Root>
