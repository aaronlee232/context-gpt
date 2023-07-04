<script lang="ts">
	import Markdown from '@magidoc/plugin-svelte-marked';
	import getChatResponse from '$lib/api-requests/get-chat-response';
	import type { Message } from '$lib/types/globals';

	let input = '';
	let messages: Message[] = [];
	let context: string = '';
	let actualConversation: string = '';

	// Send query to gpt document
	const handleSubmit = async () => {
		messages.push({ role: 'user', content: input });
		messages = messages;

		const { aiMessage, contextText, conversationText } = await getChatResponse(input);

		messages.push(aiMessage);
		messages = messages;
		context = contextText;
		actualConversation = conversationText;
	};
</script>

<div>
	<h1>User-Facing Chat History</h1>
	{#each messages as message}
		<Markdown source={`${message.role}: ${message.content}`} />
		<br />
	{/each}
</div>

<form on:submit={handleSubmit}>
	<input bind:value={input} />
	<button type="submit">Send</button>
</form>

<div>
	<h1>Context Used</h1>
	<Markdown source={`\`\`\`\`\`${context}\`\`\`\`\``} />
</div>

<div>
	<h1>Actual History Used by AI</h1>
	<Markdown source={`\`\`\`\`\`${actualConversation}\`\`\`\`\``} />
</div>
