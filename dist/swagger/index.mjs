var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
import theme from "./SwaggerDark.css";
const html = String.raw;
const CDN_BASE = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@^5";
export default function createSwaggerPage(title) {
  return html(_a || (_a = __template(['\n		<!doctype html>\n		<html lang="en">\n			<head>\n				<meta charset="utf-8" />\n				<meta name="viewport" content="width=device-width, initial-scale=1" />\n				<meta name="description" content="', '" />\n				<title>', '</title>\n				<link rel="stylesheet" href="', '/swagger-ui.css" />\n				<style>\n					', '\n				</style>\n			</head>\n			<body>\n				<div id="swagger-ui"></div>\n				<script src="', '/swagger-ui-bundle.js" crossorigin><\/script>\n				<script\n					src="', `/swagger-ui-standalone-preset.js"
					crossorigin
				><\/script>
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
				<\/script>
			</body>
		</html>
	`])), title, title, CDN_BASE, theme, CDN_BASE, CDN_BASE);
}
