import { pipeline } from '@xenova/transformers';
import { AutoTokenizer } from '@xenova/transformers';

const generateEmbeddings = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

export const getEmbeddingsFromText = async (text: string): Promise<number[]> => {
	const embeddings = await generateEmbeddings(text, {
		pooling: 'mean',
		normalize: true
	});
	return Array.from(embeddings.data);
};

export const getTokenCount = async (text: string): Promise<number> => {
	let tokenizer = await AutoTokenizer.from_pretrained('Xenova/all-MiniLM-L6-v2');
	let { input_ids } = await tokenizer(text);
	return input_ids.size;
};

export const getSimilarity = (vectorA: number[], vectorB: number[]) => {
	const dotProduct = (vectorA: number[], vectorB: number[]) => {
		let result = 0;

		for (let i = 0; i < vectorA.length; i++) {
			if (vectorA.length !== vectorB.length) {
				throw new Error('Both arguments must be of same length');
			}

			result += vectorA[i] * vectorB[i];
		}
		return result;
	};

	return dotProduct(vectorA, vectorB);
};
