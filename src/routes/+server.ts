import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import generateEmbeddings from '$lib/scripts/generate-embeddings';

export const GET: RequestHandler = async () => {
	const sectionsData = await generateEmbeddings();
	return json(sectionsData);
};
