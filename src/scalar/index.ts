import theme from './styles.css'

const html = String.raw

export default function createScalarPage(title: string) {
	const configuration = {
		spec: {
			url: '/openapi',
		},
	}

	return html`
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="description" content="${title}" />
				<title>${title}</title>
				<style>
					${theme}
				</style>
			</head>
			<body>
				<script
					id="api-reference"
					data-configuration="${JSON.stringify(configuration)
						.split('"')
						.join('&quot;')}"
				></script>
				<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
			</body>
		</html>
	`
}

