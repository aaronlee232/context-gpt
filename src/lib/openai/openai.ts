import { Configuration, OpenAIApi } from 'openai';

import { OPENAI_KEY } from '$env/static/private';

const config = new Configuration({
	apiKey: OPENAI_KEY
});

export const openai = new OpenAIApi(config);
