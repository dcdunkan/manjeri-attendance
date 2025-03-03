import type { PageProps } from "./$types";

export type AccountSession = Awaited<PageProps["data"]["sessions"]>[number];
