const alfy = require('alfy');
const got = require('got');
const input = alfy.input.toLowerCase();

function parseAwesomeProjects(body) {
  const lines = body.split(/\n+/);
  var category = null;
  var parent_title = '';
  return lines.map(line => {
      line = line.trimRight();
      if (line === '') return;
      var m = /^#+\s+(.+)/.exec(line);
      if (m) {
        category = m[1].trim();
        return;
      }
      if (!category) return;

      m = /^-\s+\[(.+?)\]\((http.+?)\)(?:\s+-\s+(.+))?/.exec(line);
      if (m) {
        parent_title = m[1];
        return {
          title: parent_title,
          subtitle: !m[3] ? '' : m[3],
          category: category,
          parent: '',
          url: m[2],
        };
      }

      m = /^\s*-\s+\[(.+?)\]\((http.+?)\)(?:\s+-\s+(.+))?/.exec(line);
      if (m && parent_title !== '') {
        return {
          title: m[1],
          subtitle: !m[3] ? '' : m[3],
          category: category,
          parent: parent_title,
          url: m[2],
        };
      }
      return;
    })
    .filter(item => item);
}

function comp(a, b) {
  const i = a.indexOf(input);
  const j = b.indexOf(input);
  if (i >= 0 && j >= 0) {
    if (i - j === 0) {
      if (a.length === b.length) return a.localeCompare(b);
      return a.length - b.length;
    }
    return i - j;
  }
  if (i >= 0) return -1;
  if (j >= 0) return 1;
  return a.localeCompare(b);
}

function filter(items) {
  return items
    .filter(item => {
      const i = input.replace(/[-_.\/+&\s\W]/g, '');
      const title = item.title.toLowerCase().normalize('NFD');
      const subtitle = item.subtitle.toLowerCase().normalize('NFD');
      const category = item.category.toLowerCase().normalize('NFD');
      const parent = item.parent.toLowerCase().normalize('NFD');
      return title.replace(/[-_.\/+&\s\W]/g, '').indexOf(i) >= 0 ||
        subtitle.replace(/[-_.\/+&\s\W]/g, '').indexOf(i) >= 0 ||
        category.replace(/[-_.\/+&\s\W]/g, '').indexOf(i) >= 0 ||
        parent.replace(/[-_.\/+&\s\W]/g, '').indexOf(i) >= 0;
    })
    .sort((a, b) => comp(a.subtitle.toLowerCase(), b.subtitle.toLowerCase()))
    .sort((a, b) => comp(a.category.toLowerCase(), b.category.toLowerCase()))
    .sort((a, b) => comp(a.parent.toLowerCase(), b.parent.toLowerCase()))
    .sort((a, b) => comp(a.title.toLowerCase(), b.title.toLowerCase()))
    .map(item => {
      var parent = item.parent;
      if (parent !== '') parent += ' > ';
      var desc = item.subtitle;
      if (desc !== '') desc = ' | ' + desc;
      return {
        title: item.title,
        subtitle: parent + item.category + desc,
        arg: item.url
      };
    });
}

const items = alfy.cache.get('items');
const now = alfy.config.get('now') || Date.now();
const gap = Date.now() - now;
const tolerance = 1000 * 3600 * 24;

if (items && gap < tolerance) {
  const output = filter(items);
  alfy.output(output);
} else {
  const url = 'https://raw.githubusercontent.com/' +
    'sindresorhus/awesome/master/readme.md';
  got(url)
    .then(response => {
      const items = parseAwesomeProjects(response.body);
      alfy.cache.set('items', items);
      const output = filter(items);
      alfy.output(output);
      alfy.config.set('now', Date.now());
    })
    .catch(error => {
      alfy.log(error);
    });
}

