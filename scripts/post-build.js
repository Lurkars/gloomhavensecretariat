const fs = require('fs');
const package_version = require('../package.json').version;

// restore index.html
const index_html_path = './src/index.html';
let index_html = fs.readFileSync(index_html_path, 'utf8');
index_html = index_html.replace(package_version, '@APP_VERSION@');
fs.writeFile(index_html_path, index_html, 'utf8', (err) => {
  if (err) {
    console.error(err);
  }
});

// restore ngsw-config.json
const ngsw_json_path = './ngsw-config.json';
let ngsw_json = fs.readFileSync(ngsw_json_path, 'utf8');
ngsw_json = ngsw_json.replace(package_version, '@APP_VERSION@');
fs.writeFile(ngsw_json_path, ngsw_json, 'utf8', (err) => {
  if (err) {
    console.error(err);
  }
});