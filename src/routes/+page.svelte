<script lang="ts">
	import Markdown from '@magidoc/plugin-svelte-marked';
	import getChatResponse from '$lib/api-requests/get-chat-response';
	import type { Message } from '$lib/types/globals';

	let input = '';
	let messages: Message[] = [];

	// Send query to gpt document
	const handleSubmit = async () => {
		messages.push({ role: 'user', content: input });
		messages = messages;

		const response = await getChatResponse(input);
		messages.push(response);
		messages = messages;
	};
</script>

<div>
	{#each messages as message}
		<Markdown source={`${message.role}: ${message.content.toString()}`} />
		<br />
	{/each}
</div>

<form on:submit={handleSubmit}>
	<input bind:value={input} />
	<button type="submit">Send</button>
</form>
