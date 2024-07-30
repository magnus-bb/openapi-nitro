var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
import theme from "./styles.css";
const html = String.raw;
export default function createScalarPage(title) {
  const configuration = {
    spec: {
      url: "/openapi"
    }
  };
  return html(_a || (_a = __template(['\n		<!DOCTYPE html>\n		<html lang="en">\n			<head>\n				<meta charset="utf-8" />\n				<meta name="viewport" content="width=device-width, initial-scale=1" />\n				<meta name="description" content="', '" />\n				<title>', "</title>\n				<style>\n					", '\n				</style>\n			</head>\n			<body>\n				<script\n					id="api-reference"\n					data-configuration="', '"\n				><\/script>\n				<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"><\/script>\n			</body>\n		</html>\n	'])), title, title, theme, JSON.stringify(configuration).split('"').join("&quot;"));
}
