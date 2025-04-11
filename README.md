##### [Lemmydocs 7:4](https://join-lemmy.org/docs/users/06-other-features.html) – Thou shall create a blog

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

#### TODO
- Possible compatibility issues with older iOS devices. Let me know if you encounter an issue! I'll be cleaning up the code in the meantime.
- The only class not written by me is the markdown-html translation layer for which I'm using [snarkdown](https://github.com/developit/snarkdown). It does so using regex queries. As to not completely re-invent the wheel I've forked it for this purpose, but I'd like to write one myself. 
