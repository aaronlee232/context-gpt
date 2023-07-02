export type Message = {
	role: string;
	content: string;
};

export type Embedding = number[];

type Conversation = {
	content: string;
	embedding: Embedding;
};
