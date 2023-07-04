import axios from 'axios';
import type { Message } from '$lib/types/globals';
import { PUBLIC_BASE_URL } from '$env/static/public';

const getChatResponse = async (
	query: string
): Promise<{ aiMessage: Message; contextText: string; conversationText: string }> => {
	const endpointURL = PUBLIC_BASE_URL + 'chat';
	const result = await axios.post(endpointURL, {
		query
	});

	return result.data;
};

export default getChatResponse;
