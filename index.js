const alfy = require('alfy');
const got = require('got');
const input = alfy.input.toLowerCase();

function comp(a, b) {
  const i = a.indexOf(input);
  const j = b.indexOf(input);
  if (i >= 0 && j >= 0) {
    if (i - j === 0) return a.length - b.length;
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

const url = 'https://alfred-workflows-62254.firebaseio.com/awe.json';
alfy.fetch(url, {
    maxAge: 86400000, // 24 hours
  })
  .then(items => {
    const output = filter(items);
    alfy.output(output);
  });

