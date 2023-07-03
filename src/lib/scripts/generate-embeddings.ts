// Read in markdown file
import { readdirSync, readFileSync } from 'fs';
import type { Content, Root } from 'mdast';
import { u } from 'unist-builder';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { mdxjs } from 'micromark-extension-mdxjs';
import { mdxFromMarkdown } from 'mdast-util-mdx';
import { filter } from 'unist-util-filter';
import { toString } from 'mdast-util-to-string';
import { toMarkdown } from 'mdast-util-to-markdown';
import GithubSlugger from 'github-slugger';
import { getEmbeddingFromText, getTokenCount } from './embeddings-transformer';
import { supabase } from '$lib/scripts/supabase-client';
import { getAllFiles } from './read-documents';

type Section = {
	content: string;
	heading?: string;
	slug?: string;
};

type ProcessedMD = {
	sections: Section[];
};

const processMarkdown = async (doc: string): Promise<ProcessedMD> => {
	/**
	 * Splits a `mdast` tree into multiple trees based on
	 * a predicate function. Will include the splitting node
	 * at the beginning of each tree.
	 *
	 * Useful to split a markdown file into smaller sections.
	 */
	const splitTreeBy = (tree: Root, predicate: (node: Content) => boolean) => {
		return tree.children.reduce<Root[]>((trees, node) => {
			const [lastTree] = trees.slice(-1);

			if (!lastTree || predicate(node)) {
				const tree: Root = u('root', [node]);
				return trees.concat(tree);
			}

			lastTree.children.push(node);
			return trees;
		}, []);
	};

	// @ts-ignore
	const mdxTree = fromMarkdown(doc);

	// ignore meta(?)

	// Remove all MDX elements from markdown
	const mdTree = filter(
		mdxTree,
		(node) =>
			![
				'mdxjsEsm',
				'mdxJsxFlowElement',
				'mdxJsxTextElement',
				'mdxFlowExpression',
				'mdxTextExpression'
			].includes(node.type)
	);

	if (!mdTree) {
		return {
			// checksum,
			// meta,
			sections: []
		};
	}

	const sectionTrees = splitTreeBy(mdTree, (node) => node.type === 'heading');

	const slugger = new GithubSlugger();

	const sections = sectionTrees.map((tree) => {
		const [firstNode] = tree.children;

		const heading = firstNode.type === 'heading' ? toString(firstNode) : undefined;
		const slug = heading ? slugger.slug(heading) : undefined;

		return {
			content: toMarkdown(tree),
			heading,
			slug
		};
	});

	return {
		// checksum,
		// meta,
		sections
	};
};

type SectionData = {
	content: string;
	token_count: number;
	embedding: number[];
};

const insertEmbeddingsIntoDB = async (sectionsData: SectionData[]) => {
	sectionsData.forEach(async (sectionData) => {
		const result = await supabase.from('page_section').insert({
			content: sectionData.content,
			token_count: sectionData.token_count,
			embedding: sectionData.embedding
		});
	});
};

const BASE_PAGES_PATH = 'src/lib/md-pages/';

const generateEmbeddings = async () => {
	const files = getAllFiles(BASE_PAGES_PATH);

	const sectionsData: SectionData[] = [];
	for (let file of files) {
		const { sections } = await processMarkdown(file);

		for (const section of sections) {
			const data: SectionData = {
				content: section.content,
				token_count: await getTokenCount(section.content),
				embedding: await getEmbeddingFromText(section.content)
			};
			sectionsData.push(data);
		}
	}

	await insertEmbeddingsIntoDB(sectionsData);

	return sectionsData;
};

export default generateEmbeddings;
