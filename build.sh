#!/bin/bash
echo "Building website into one file!"
node minify_all_code.js
echo "Brotli: compressing into index.html"
brotli index.html
echo "Done!"
echo "Build files: index.html & index.html.br"

#Optional Move
mv index* ../kernelle.github.io/
echo "Moved files to GitPages"
