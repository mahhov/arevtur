const fetch = require('C:\\Users\\xxx\\personal\\arevtur\\node_modules\\node-fetch');

let sessionId = '74f0eab98e3f1b23a70bd2c5f5ceb294';

let headerss = {
	// headers: {
	// 	'User-Agent': `arevtur_0123`,
	// 	Cookie: sessionId ? `POESESSID=${sessionId}` : '',
	// 	'content-type': 'application/json',
	// 	'x-requested-with': 'XMLHttpRequest',
	// },
	// headers2: {
	// 	'User-Agent': `arevtur2_0123`,
	// 	Cookie: sessionId ? `POESESSID=${sessionId}` : '',
	// 	'content-type': 'application/json',
	// 	'Accept-Encoding': 'gzip',
	// },
	headersMin: {
		'User-Agent': `arevtur_0123`,
		Cookie: sessionId ? `POESESSID=${sessionId}` : '',
		'content-type': 'application/json',
		'x-requested-with': 'XMLHttpRequest',
	},
};

let requests = {
	// stats: {
	// 	type: 'GET',
	// 	endpoint: 'https://pathofexile.com/api/trade/data/stats',
	// 	body: undefined,
	// },
	// stats2: {
	// 	type: 'GET',
	// 	endpoint: 'https://pathofexile.com/api/trade2/data/stats',
	// 	body: undefined,
	// },
	// tradeQuery: {
	// 	type: 'POST',
	// 	endpoint: 'https://www.pathofexile.com/api/trade/search/Settlers',
	// 	body: {
	// 		'query': {'status': {'option': 'online'}, 'stats': [{'type': 'and', 'filters': []}]},
	// 		'sort': {'price': 'asc'},
	// 	},
	// },
	// tradeQuery2: {
	// 	type: 'POST',
	// 	endpoint: 'https://www.pathofexile.com/api/trade2/search/poe2/Standard',
	// 	body: {
	// 		'query': {'status': {'option': 'online'}, 'stats': [{'type': 'and', 'filters': []}]},
	// 		'sort': {'price': 'asc'},
	// 	},
	// },
	// itemQuery: {
	// 	type: 'GET',
	// 	endpoint: 'https://www.pathofexile.com/api/trade/fetch/cef60253aa6c4882d0b31df30591bfd4d4d7ba745dd16df995508c89c8e7c89a,fd063357f49c2d67cc4ee503759983a0b01ffd46489ae9b88536aaae1b611b43,a53bac653c3b8e499eb06c56cad1f617794f2f313e3c3a94e99c42be8b5742b2,6d32e94eac28413e04cd3ac6b13dee0ee08309ea39e7707e4f3d5f9cf4733ab0,7f16024ae7c7f4cef6028f36bec20e7732de6b7c143435a533f678e88e29fca1,242ef3d1cac47cc8ceff20efd4d44f3505446a5f8c70f2b1d8f9d5eb03b0491c,56ae8ef661c1df83f357d08db2a94d9eaa0c431da4d8fe13c391c6d6352efed1,144e7df454964fd88d954bef075f89a4dd788b0e44b071d96e0d501f543bddd4,7ef2d55825dd33a85384952171da30b3cb67755c335048dab414cb2f71b280bd,488ee25d51601d7b75942b5c26b5ae11d71a71c673d2bdc8e23dd8bf9d6014c8?query=Ab3LSL',
	// 	body: undefined,
	// },
	// itemQuery2: {
	// 	type: 'GET',
	// 	endpoint: 'https://www.pathofexile.com/api/trade2/fetch/a61ca760a7dc0ce10d437c3c21282d749598d93372caf8e4c28086c52f7ebea8,316d3bbda694ddbe0f88c363e5ed80f0421da6bc5f2510762a8a645a105a7806,4e588b6d3534979879384c2afba4b578d8b08da1c671364a725debac5b3b4b7b,c6f459b239b51cc290df1f2730803af1d8230a1f945554e118dad94a35bd1f67,9357ab59fb3c8e711e5275dd9ee74e2e15bb19389ee50f4c345a6f47bed86547,eddf8346aa43b022a2a99341adf30e76de93ac6d2f9e6685e00973b58f17543f,3bc743f0f0c4f8d52860aba940d3d810822150f5a23e344114692b542c9c0784,64a313c15c5e9184567be61c2e03872bda5bb8e02f0c6872915697eea498b8e6,5bc66dd6a4621d7862e3e82449c6ef1182b7b65d954210ba5fb66c6fd89bd7a7,601e95381527a3371316e052536279b6c458996ec0a93b5485443839bdaafbe4?query=EDQkqeVT5&realm=poe2',
	// 	body: undefined,
	// },
	whisper: {
		type: 'POST',
		endpoint: 'https://www.pathofexile.com/api/trade/whisper',
		body: {'token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJmMDgzMGEzZDM0ZTJmZTkzNjQ1ZDFiMTJjNjA3MzY0YSIsImlzcyI6IkFiM0xTTCIsImF1ZCI6IjFkMDhmNDFiLWNhNzctNDM0OS04MTU3LTA2NTc4NzAwNTQ0YyIsImRzdCI6ImNhbl9zZXR0bGVyc196b28iLCJsb2MiOiJlbl9VUyIsInRvayI6Iml0ZW0iLCJzdWIiOiJjZWY2MDI1M2FhNmM0ODgyZDBiMzFkZjMwNTkxYmZkNGQ0ZDdiYTc0NWRkMTZkZjk5NTUwOGM4OWM4ZTdjODlhIiwiZGF0IjoiMmZkMzg1NmMwMjdiMmJlNmRlZDllYjhmZWEzNmRmMzIiLCJpYXQiOjE3MzUyNDIzOTIsImV4cCI6MTczNTI0MjY5Mn0._82yHnQoctPGceNlInntf-bOEleW9_AY4jCeWtefQLg'},
	},
	whisper2: {
		type: 'POST',
		endpoint: 'https://www.pathofexile.com/api/trade/whisper',
		body: {'token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJmMDgzMGEzZDM0ZTJmZTkzNjQ1ZDFiMTJjNjA3MzY0YSIsImlzcyI6IkFiM0xTTCIsImF1ZCI6IjFkMDhmNDFiLWNhNzctNDM0OS04MTU3LTA2NTc4NzAwNTQ0YyIsImRzdCI6ImNhbl9zZXR0bGVyc196b28iLCJsb2MiOiJlbl9VUyIsInRvayI6Iml0ZW0iLCJzdWIiOiJjZWY2MDI1M2FhNmM0ODgyZDBiMzFkZjMwNTkxYmZkNGQ0ZDdiYTc0NWRkMTZkZjk5NTUwOGM4OWM4ZTdjODlhIiwiZGF0IjoiMmZkMzg1NmMwMjdiMmJlNmRlZDllYjhmZWEzNmRmMzIiLCJpYXQiOjE3MzUyNDIzOTIsImV4cCI6MTczNTI0MjY5Mn0._82yHnQoctPGceNlInntf-bOEleW9_AY4jCeWtefQLg'},
	},
};

let main = async () => {
	for (let requestsKey in requests) {
		let request = requests[requestsKey];
		console.log('>>', requestsKey, '<<');
		for (let headersKey in headerss) {
			let headers = headerss[headersKey];
			console.log(headersKey, '\n');
			try {
				let response = await fetch(request.endpoint, {
					method: request.type,
					body: JSON.stringify(request.body),
					headers,
				});
				console.log(response, (await response.text()).slice(0, 100));
			} catch (e) {
				console.log(e);
			}
			console.log('\n\n\n');
		}
	}
};
main();
