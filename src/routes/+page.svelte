<script lang="ts">
	import getChatResponse from '$lib/api-requests/get-chat-response';
	import type { Message } from '$lib/types/globals';

	let input = '';
	let messages: Message[] = [];

	// Send query to gpt document
	const handleSubmit = async () => {
		const response = await getChatResponse(input);
		messages.push(response);
		messages = messages;
	};
</script>

<ul>
	{#each messages as message}
		<li>{message.role}: {message.content}</li>
	{/each}
</ul>

<form on:submit={handleSubmit}>
	<input bind:value={input} />
	<button type="submit">Send</button>
</form>
