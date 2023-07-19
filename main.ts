import { serve } from 'https://deno.land/std@0.140.0/http/server.ts';
import { load } from 'https://deno.land/std/dotenv/mod.ts';

const env = await load();
const key = env['DEEPL_AUTH_KEY'];

const PORT = 3003;
const HOSTNAME = 'localhost'; // other hostnames may have to be added to /etc/hosts too.
const PROTOCOL = 'http';

const baseUrl = `${PROTOCOL}://${HOSTNAME}:${PORT}`;

const translate = async (
	text: string,
	targetLang: string,
	sourceLang: string,
): Promise => {
	const response = await fetch('https://api-free.deepl.com/v2/translate', {
		headers: {
			accept: 'application/json',
			'Authorization': `DeepL-Auth-Key ${key}`,
			'Content-Type': 'application/json',
		},
		method: 'POST',
		body: JSON.stringify(
			{
				text: [
					text,
				],
				target_lang: targetLang,
				source_lang: sourceLang,
			},
			null,
			2,
		),
	}).catch((e) => console.error('error during req', e));
	const json = await response.json().catch((e) =>
		console.error('error during parse', e, response)
	);
	if (!json) return 'error during translation';
	const { translations } = json;
	console.log(json);
	if (!translations) return 'could not be translated';
	const [res] = translations;
	return res?.text;
};

const pageWrapper = (content: string): string =>
	`<!DOCTYPE html>
<html>
    <head>
        <title>Translate</title>
        <link rel="search" type="application/opensearchdescription+xml" title="Translate" href="${baseUrl}/opensearch.xml" />
    </head>
    <body> ${content} </body></html>
`;

const XMLResponse = (content: string): Response =>
	new Response(content, {
		headers: {
			'content-type':
				'application/opensearchdescription+xml; charset=utf-8',
		},
	});

const JSONResponse = (obj: object): Response =>
	new Response(JSON.stringify(obj), {
		headers: {
			'content-type': 'application/json; charset=utf-8', // 'application/x-suggestions+json'
		},
	});

const PageResponse = (content: string): Response =>
	new Response(pageWrapper(content), {
		headers: { 'content-type': 'text/html; charset=utf-8' },
	});

const router = async (req: Request, conn: ConnInfo): Promise<Response> => {
	const { pathname: path, searchParams: query } = new URL(req.url);
	console.log(path);
	if (path === '/') {
		return PageResponse('<h1>👀</h1>');
	}

	// live suggestions
	if (path === '/suggestions') {
		const q = query.get('q');
		const terms = q.split(' ');
		let targetLang = terms.shift();
		let sourceLang;
		let response = ['Please enter a language and a text.'];
		if (
			targetLang.length > 0 && targetLang.length !== 2 &&
			targetLang.length !== 4
		) {
			response = ['invalid language definition: "' + targetLang + '".'];
		} else {
			if (targetLang.length === 4) {
				sourceLang = targetLang.substring(0, 2);
				targetLang = targetLang.substring(2, 4);
			}

			const toTranslate = terms.join(' ');
			if (!toTranslate) {
				response = [
					`Continue with a text to be translated to '${targetLang}'.`,
				];
			} else {
				const translation = await translate(
					toTranslate,
					targetLang,
					sourceLang,
				);
				response = [
					`'${toTranslate}' ${
						sourceLang ? ` (from ${sourceLang})` : ''
					} is in '${targetLang}':`,
				];
				response.push(`${translation} `);
			}
		}
		return JSONResponse([q, response]);
	}

	if (path === '/search') {
		const terms = query.get('q').split(' ');
		return PageResponse('search: ' + terms.join('; '));
	}

	if (path === '/opensearch.xml') {
		return XMLResponse(`<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/"
                       xmlns:moz="http://www.mozilla.org/2006/browser/search/">
  <ShortName>Translate</ShortName>
  <Description>Translate in the searchbar</Description>
  <InputEncoding>[UTF-8]</InputEncoding>
  <Url type="text/html" template="${baseUrl}/search?q={searchTerms}"/>
  <Url type="application/x-suggestions+json" template="${baseUrl}/suggestions?q={searchTerms}"/>
  <moz:SearchForm>${baseUrl}/search</moz:SearchForm>
</OpenSearchDescription>`);
	}

	return new Response('route not found', { status: 404 });
};

if (import.meta.main) {
	serve(router, { port: PORT });
}
