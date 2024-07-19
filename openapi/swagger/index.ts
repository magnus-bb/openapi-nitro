import theme from './SwaggerDark.css'

const html = String.raw

const CDN_BASE = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@^5"

export default function createSwaggerPage(title: string) {
	return html`
		<!doctype html>
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="description" content="${title}" />
				<title>${title}</title>
				<link rel="stylesheet" href="${CDN_BASE}/swagger-ui.css" />
				<style>
					${theme}
				</style>
			</head>
			<body>
				<div id="swagger-ui"></div>
				<script src="${CDN_BASE}/swagger-ui-bundle.js" crossorigin></script>
				<script
					src="${CDN_BASE}/swagger-ui-standalone-preset.js"
					crossorigin
				></script>
				<script>
					window.onload = () => {
						window.ui = SwaggerUIBundle({
							url: '/openapi',
							dom_id: "#swagger-ui",
							presets: [
								SwaggerUIBundle.presets.apis,
								SwaggerUIStandalonePreset,
							],
							layout: "BaseLayout",
							syntaxHighlight: {
								theme: 'nord'
							}
						});
					};
				</script>
			</body>
		</html>
	`
}

