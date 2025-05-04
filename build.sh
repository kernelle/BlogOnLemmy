#!/bin/bash
echo "Building website into one file!"
node minify_all_code.js
echo "Brotli: compressing into index_min.html"
rm index_min.html.br
brotli index_min.html
echo "Done!"
echo "Build files: index_min.html & index_min.html.br"
