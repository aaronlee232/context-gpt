import type { RequestHandler } from './$types';
import { Configuration, OpenAIApi, ChatCompletionRequestMessageRoleEnum } from 'openai';
import type { ChatCompletionRequestMessage } from 'openai';
import { OPENAI_KEY } from '$env/static/private';
import { getEmbeddingFromText } from '$lib/scripts/embeddings-transformer';
import axios from 'axios';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/scripts/supabase-client';
import GPT3Tokenizer from 'gpt3-tokenizer';
import { codeBlock, oneLine } from 'common-tags';

const config = new Configuration({
	apiKey: OPENAI_KEY
});

const openai = new OpenAIApi(config);

export const POST: RequestHandler = async ({ request }) => {
	const { query } = await request.json();
	const sanitizedQuery = query.trim();

	moderateQuery(sanitizedQuery);

	const embedding = await getEmbeddingFromText(sanitizedQuery.replaceAll('\n', ' '));

	const { error: matchError, data: pageSections } = await supabase.rpc('match_page_sections', {
		embedding,
		match_threshold: 0.3,
		match_count: 10,
		min_content_length: 50
	});

	if (matchError) {
		console.log(matchError.message);
		throw matchError;
	}

	const tokenizer = new GPT3Tokenizer({ type: 'gpt3' });
	let tokenCount = 0;
	let contextText = '';

	for (let i = 0; i < pageSections.length; i++) {
		const pageSection = pageSections[i];
		const content = pageSection.content;
		const encoded = tokenizer.encode(content);
		tokenCount += encoded.text.length;

		if (tokenCount >= 1500) {
			break;
		}

		contextText += `${content.trim()}\n---\n`;
	}

	const messages: ChatCompletionRequestMessage[] = [
		{
			role: ChatCompletionRequestMessageRoleEnum.System,
			content: codeBlock`
          ${oneLine`
            You are a very enthusiastic personal AI who loves
            to help people! Given the following information from
            the personal documentation, answer the user's question using
            only that information, outputted in markdown format.
          `}

          ${oneLine`
            If you are unsure
            and the answer is not explicitly written in the documentation, say
            "Sorry, I don't know how to help with that."
          `}
          
          ${oneLine`
            Always include related code snippets if available.
          `}
        `
		},
		{
			role: ChatCompletionRequestMessageRoleEnum.User,
			content: codeBlock`
          Here is my personal documentation:
          ${contextText}
        `
		},
		{
			role: ChatCompletionRequestMessageRoleEnum.User,
			content: codeBlock`
          ${oneLine`
            Answer my next question using only the above documentation.
            You must also follow the below rules when answering:
          `}
          ${oneLine`
            - Do not make up answers that are not provided in the documentation.
          `}
          ${oneLine`
            - If you are unsure and the answer is not explicitly written
            in the documentation context, say
            "Sorry, I don't know how to help with that."
          `}
          ${oneLine`
            - Prefer splitting your response into multiple paragraphs.
          `}
          ${oneLine`
            - Output as markdown with code snippets if available.
          `}
        `
		},
		{
			role: ChatCompletionRequestMessageRoleEnum.User,
			content: codeBlock`
          Here is my question:
          ${oneLine`${sanitizedQuery}`}
      `
		}
	];

	const response = await openai.createChatCompletion({
		model: 'gpt-3.5-turbo',
		messages,
		max_tokens: 1024,
		temperature: 0
	});

	if (response.status !== 200) {
		throw new Error('Failed to complete');
	}

	return json(response.data.choices[0]);
};

const moderateQuery = async (sanitizedQuery: string) => {
	const moderationResponse = await openai.createModeration({ input: sanitizedQuery });

	const [results] = moderationResponse.data.results;

	if (results.flagged) {
		return json({ error: 'flagged content', flagged: true, categories: results.categories });
	}
};
