import type { RequestHandler } from './$types';
import { ChatCompletionRequestMessageRoleEnum } from 'openai';
import type { ChatCompletionRequestMessage } from 'openai';
import { getEmbeddingFromText } from '$lib/scripts/embeddings-transformer';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/scripts/supabase-client';
import GPT3Tokenizer from 'gpt3-tokenizer';
import { codeBlock, oneLine } from 'common-tags';
import { ConversationStore } from '../Store';
import type { Conversation, Embedding } from '$lib/types/globals';
import { openai } from '$lib/openai/openai';

export const POST: RequestHandler = async ({ request }) => {
	const { query } = await request.json();
	const sanitizedQuery = query.trim();

	moderateQuery(sanitizedQuery);

	const embedding = await getEmbeddingFromText(sanitizedQuery.replaceAll('\n', ' '));

	const tokenizer = new GPT3Tokenizer({ type: 'gpt3' });

	// Collect context
	let tokenCount = 0;
	const contextText = await getContextText(embedding, tokenizer, tokenCount);
	const conversationText = await getConversationText(embedding, tokenizer, tokenCount);

	// Embed message within prompt and context
	const messages: ChatCompletionRequestMessage[] = createMessagesWithPrompt(
		sanitizedQuery,
		contextText,
		conversationText
	);

	// Send message to chat gpt api and get response
	const response = await openai.createChatCompletion({
		model: 'gpt-3.5-turbo',
		messages,
		max_tokens: 1024,
		temperature: 0
	});

	if (response.status !== 200) {
		throw new Error('Failed to complete');
	}

	const aiResponse = response.data.choices[0];
	const aiMessage = String(aiResponse.message?.content);
	const aiEmbedding = await getEmbeddingFromText(aiMessage);

	// Add current query embedding to ConversationEmbeddingStore
	ConversationStore.update((conversations: Conversation[]) => {
		const currentConversations = [
			{ content: `user: ${sanitizedQuery}`, embedding: embedding }, // query
			{ content: `assistant: ${aiMessage}`, embedding: aiEmbedding } // ai response
		];
		return [...currentConversations, ...conversations];
	});

	return json(aiResponse);
};

const moderateQuery = async (sanitizedQuery: string) => {
	const moderationResponse = await openai.createModeration({ input: sanitizedQuery });

	const [results] = moderationResponse.data.results;

	if (results.flagged) {
		return json({ error: 'flagged content', flagged: true, categories: results.categories });
	}
};

const match_past_conversations = (
	pastConversations: Conversation[],
	options: {
		embedding: number[];
		match_threshold: number;
		match_count: number;
		min_content_length: number;
	}
) => {
	const getDotProduct = (embeddingA: Embedding, embeddingB: Embedding) => {
		if (embeddingA.length != embeddingB.length) {
			throw new Error('embeddings must be of same length to perform dot product calculations');
		}

		let dotproduct = 0;
		for (let i = 0; i < embeddingA.length; i++) {
			dotproduct += embeddingA[i] * embeddingB[i];
		}
		return dotproduct;
	};

	// calculate dot product of past conversation embeddings with current query's embedding
	let pastConversationsWithSimilarity = pastConversations.map((conversation) => {
		const similarity = getDotProduct(conversation.embedding, options.embedding);
		return { ...conversation, similarity: similarity };
	});

	pastConversationsWithSimilarity.sort((a, b) => {
		return b.similarity - a.similarity;
	});

	// Filter relevant conversations based on options
	let relevantConversations = [];
	for (let conversation of pastConversationsWithSimilarity) {
		if (
			conversation.similarity >= options.match_threshold &&
			relevantConversations.length < options.match_count &&
			conversation.content.length >= options.min_content_length
		) {
			relevantConversations.push(conversation);
		}
	}

	return relevantConversations;
};

const getContextText = async (
	embedding: Embedding,
	tokenizer: GPT3Tokenizer,
	tokenCount: number
) => {
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

	// Add relevant page sections to context
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
	return contextText;
};

const getConversationText = async (
	embedding: Embedding,
	tokenizer: GPT3Tokenizer,
	tokenCount: number
) => {
	let pastConversations = [] as Conversation[];
	ConversationStore.subscribe((conversations: Conversation[]) => {
		pastConversations = conversations;
	});

	const RECENT_CONVERSATION_CUTOFF = 10;

	// Add the 3 most recent conversations to conversation history
	let recentConversations = pastConversations.slice(0, RECENT_CONVERSATION_CUTOFF);
	let conversationText = '';
	for (let i = 0; i < recentConversations.length; i++) {
		const conversation = recentConversations[i];
		const content = conversation.content;
		const encoded = tokenizer.encode(content);
		tokenCount += encoded.text.length;

		if (tokenCount >= 1500) {
			break;
		}

		conversationText += `${content.trim()}\n---\n`;
	}

	// Match current query embedding with past query embeddings and include most relevant ones in contextText
	let relatedConversations = match_past_conversations(
		pastConversations.slice(RECENT_CONVERSATION_CUTOFF),
		{
			embedding,
			match_threshold: 0.3,
			match_count: 10,
			min_content_length: 0
		}
	);

	// Add relevant past conversations to conversation history
	for (let i = 0; i < relatedConversations.length; i++) {
		const conversation = relatedConversations[i];
		const content = conversation.content;
		const encoded = tokenizer.encode(content);
		tokenCount += encoded.text.length;

		if (tokenCount >= 1500) {
			break;
		}

		conversationText += `${content.trim()}\n---\n`;
	}

	return conversationText;
};

const createMessagesWithPrompt = (
	sanitizedQuery: string,
	contextText: string,
	conversationText: string
): ChatCompletionRequestMessage[] => {
	return [
		{
			role: ChatCompletionRequestMessageRoleEnum.System,
			content: codeBlock`
          ${oneLine`
            You are a very enthusiastic personal AI who loves
            to help people! Given the following information from
            the personal documentation and conversation history, 
						answer the user's question using only that information, 
						outputted in markdown format.
          `}

					${oneLine`
						In the conversation history, lines that start with 
						"assistant:" refers to you, the personal AI, and 
						lines that start with "user:" refers to me, the 
						person sending messages and asking questions to the personal AI.
					`}

          ${oneLine`
            If you are unsure
            and the answer is not explicitly written in the documentation 
						or conversation history, say "Sorry, I don't know how to 
						help with that."
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

					Here is the conversation history:
          ${conversationText}
        `
		},
		{
			role: ChatCompletionRequestMessageRoleEnum.User,
			content: codeBlock`
          ${oneLine`
            Answer my next question using only the above documentation and conversation history.
            You must also follow the below rules when answering:
          `}
          ${oneLine`
            - Do not make up answers that are not provided in the documentation.
          `}
					${oneLine`
            - You can use messages in conversation history as context to answer my next question.
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
};
