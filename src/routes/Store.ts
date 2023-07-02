import type { Conversation } from '$lib/types/globals';
import { writable } from 'svelte/store';

export const currentConversationIndex = writable(0)
export const ConversationStore = writable([] as Conversation[]);
