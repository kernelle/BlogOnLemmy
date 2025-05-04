#!/usr/bin/env node

// npm install inliner html-minifier'
// node minify_all_code.js

const fs = require('fs');
// Yeah so I ended up using two minifiers
//   mainly because inliner supports native file combining
//   and html-inliner does a better job minifying (although far from perfect)
//Exactly 30% to gain by running it through the second
const { minify } = require('html-minifier');
const Inliner = require('inliner');

const inputFile = "index.html";
const outputFile = "index_min.html";

const options = {
    collapseWhitespace: true,
    removeComments: true,
    removeAttributeQuotes: true,
    minifyCSS: true,
    minifyJS: true
};

try {
    new Inliner('index.html', function (error, html) {
         const minifiedContent = minify(html, options);
         fs.writeFileSync(outputFile, minifiedContent, 'utf-8');
         console.log(`Combined & Minified!\nInput: ${inputFile}\nOutput: ${outputFile}`);
    });


} catch (error) {
    console.error(`An error occurred: ${error.message}`);
    process.exit(1);
}
