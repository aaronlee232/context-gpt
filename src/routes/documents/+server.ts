import { test } from '$lib/scripts/read-documents';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const dirOutput = await test();
	return json(dirOutput);
};
