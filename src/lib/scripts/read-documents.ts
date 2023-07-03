import { readdirSync, readFileSync, lstatSync } from 'fs';

const BASE_PAGES_PATH = 'src/lib/md-pages/';

export const test = () => {
	const files = getAllFiles(BASE_PAGES_PATH);
	return files;
};

export const getAllFiles = (directoryPath: string) => {
	const filePaths = getAllFilePaths(directoryPath);

	const files = [];
	for (let filePath of filePaths) {
		files.push(readFileSync(filePath, 'utf8'));
	}

	return files;
};

const getDirectories = (directoryPath: string) => {
	const dirOutput = readdirSync(directoryPath, 'utf8');
	return dirOutput;
};

const isDirectory = (path: string) => {
	return lstatSync(path).isDirectory();
};

// returns all non-directory files as file path strings
const getAllFilePaths = (directoryPath: string): string[] => {
	const fileNames = getDirectories(directoryPath);

	let foundFilePaths: string[] = [];
	for (let fileName of fileNames) {
		const filePath = `${directoryPath}/${fileName}`;
		if (isDirectory(filePath)) {
			foundFilePaths = [...foundFilePaths, ...getAllFilePaths(filePath)];
		} else {
			foundFilePaths.push(filePath);
		}
	}

	return foundFilePaths;
};
