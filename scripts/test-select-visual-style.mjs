import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync("src/global_styles.scss", "utf8");
assert.match(styles, /\.choices\[data-type\*=["']select-one["']\]/);
assert.match(styles, /background(?:-color)?: transparent/);
assert.match(styles, /color: inherit/);
console.log("OK: los selectores simples no heredan el fondo de etiquetas múltiples.");
