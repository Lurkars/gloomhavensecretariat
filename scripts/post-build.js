const fs = require('fs');
const package_version = require('../package.json').version;

const index_html_path = './dist/gloomhavensecretary/index.html';
let index_html = fs.readFileSync(index_html_path, 'utf8');
index_html = index_html.replace('@APP_VERSION@', package_version);
fs.writeFile(index_html_path, index_html, 'utf8', (err) => {
  if (err) {
    console.error(err);
  }
});

const ngsw_json_path = './dist/gloomhavensecretary/ngsw.json';
let ngsw_json = fs.readFileSync(ngsw_json_path, 'utf8');
ngsw_json = ngsw_json.replace('@APP_VERSION@', package_version);
fs.writeFile(ngsw_json_path, ngsw_json, 'utf8', (err) => {
  if (err) {
    console.error(err);
  }
});