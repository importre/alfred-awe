#!/usr/bin/env node

const fs = require('fs');
const got = require('got');
const execSync = require('child_process').execSync;

const url =
  'https://raw.githubusercontent.com' +
  '/sindresorhus/awesome/master/readme.md';

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

got(url)
  .then(response => {
    const items = parseAwesomeProjects(response.body);
    const output = JSON.stringify(items, null, '  ');
    fs.writeFileSync('awe.json', output);
    console.log(execSync('firebase database:set -y /awe awe.json', {
      encoding: 'utf-8'
    }));
  })
  .catch(error => {
    console.log(error);
  });

