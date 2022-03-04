let fs = require('fs');
let https = require('https');

let plugins = JSON.parse(fs.readFileSync('./community-plugins.json', 'utf8'));
let stats = JSON.parse(fs.readFileSync('./community-plugin-stats.json', 'utf8'));

let githubToken = process.env.gh_token;

console.log(`Updating stats for ${Object.keys(plugins).length} plugins`);
let newStats = {};
for (let plugin of plugins) {
	let key = plugin.id;
	if (stats.hasOwnProperty(key)) {
		newStats[key] = stats[key];
	}
}

let saveStats = () => fs.writeFileSync('./community-plugin-stats.json', JSON.stringify(newStats, null, 2), 'utf8');

saveStats();

(async() => {
	for (let key in plugins) {
		if (!plugins.hasOwnProperty(key)) {
			continue;
		}

		for (let attempt = 0; attempt < 5; attempt++) {
			try {
				let plugin = plugins[key];
				let id = plugin.id;

				console.log(`Downloading stats for ${id}`);
				let stats = newStats[id] = newStats[id] || {};
				let repo = plugin.repo;
				let data = await download(repo);
				let releases = JSON.parse(data);
				// stats is Array<{tag_name: string, assets: Array<{name: string, download_count}>}>

				console.log(`Received ${releases.length} releases`);
				for (let release of releases) {
					let version = release.tag_name;
					let assets = release.assets;
					let downloads = 0;
					for (let asset of assets) {
						if (asset.name === 'manifest.json') {
							downloads = asset.download_count;
						}
					}
					if (downloads) {
						stats[version] = downloads;
					}
				}

				let total = 0;
				for (let version in stats) {
					if (stats.hasOwnProperty(version) && version !== 'downloads') {
						total += stats[version];
					}
				}

				console.log(`Total downloads: ${total}`);
				stats['downloads'] = total;

				saveStats();
				break;
			} catch (e) {
				console.log('Failed', e.message);
				await new Promise(resolve => setTimeout(resolve, 1000));
			}
		}
	}

	console.log('All done!');
})();

function download(repo) {
	return new Promise((resolve, reject) => {
		let req = https.get(
			{
				host: 'api.github.com',
				port: 443,
				path: '/repos/' + repo + '/releases',
				headers: {
					'User-Agent': 'Obsidian-Script',
					// Generate a permission-less token here https://github.com/settings/tokens
					// This raises the API rate limit from 60/hr to 5000/hr
					'Authorization': 'Basic ' + Buffer.from(githubToken).toString('base64')
				}
			}, 
			function (res) {
				let body = [];
				res.on('data', (data) => body.push(data));
				res.on('end', () => resolve(body.join('')));
			}
		);
		req.on('error', reject);
	});
}


