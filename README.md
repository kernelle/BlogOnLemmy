# [./Martijn.sh > Blog](https://martijn.sh)

##### [Lemmydocs 7:4](https://join-lemmy.org/docs/users/06-other-features.html) – Thou shall create a blog

## Usage

The developement constraints and a more in-depth analysis is described in [my blog post](https://martijn.sh/?post=3685758) about BlogOnLemmy.

### - Personalizing
 - index.html: edit as you wish
 - assets/js/index.js, only the top global variables are required
 - Basic knowledge of HTML and JS is required *for now* to personalise the site
 
### - Optional: Combining, Minifiying and Compressing
 - Requirements: node, html-minifier, inliner and brotli
 - Combines and minifies all HTML, CSS and javascript into one file
 
```
$ npm install html-minifier inliner
$ node minify_all_code.js
```
```
$ brotli index.html
```
*(Pre-compressed files need to be enabled on the server to deploy the index.html.br file)*

Or in a shell:

```
$ ./build.sh
```

## Features
- Linked to a user using Lemmy’s API, no authentication
- Host content on any instance
- Category filters: Set one or more community as the categories
- Easy to adapt to your profile
- One page constraint
- Anchor navigation and permalinks
- Responsive
- Dark / Light mode
- No cookies or tracking
- Interactive “about me”
- No backend: serving a single lightweight page that can be hosted anywhere, including GitHub
- HTML, CSS and ES6 JavaScript. That's it.
- Error page with link to another instance in case your main is down or unreachable

## Latest News
- Combining & Minification using a node script
- bash file to build the site and generate brotli compressed files

#### Known Issues
- Possible compatibility issues with older iOS devices. Let me know if you encounter an issue!
- Markdown: \\ are not escaped correctly
- Markdown: Numbered list headers spaced far apart don't count up (all stay 1)

## Posts about BlogOnLemmy

[How I made a blog using Lemmy - a write-up](https://martijn.sh/?post=3685758)

[BlogOnLemmy - I made my Blog using Lemmy's API](https://martijn.sh/?post=3139396)
