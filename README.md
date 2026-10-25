# ezxmldsig documentation

The concepts common to the two ezxmldsig libraries, which create and verify signed and encrypted XML tokens: why they exist, how a token works, the duties of its receiver, its encryption, the certificates it needs, its interoperability. Published by GitHub Pages: https://webcoder31.github.io/ezxmldsig-doc/.

* [ezxmldsig-php](https://github.com/webcoder31/ezxmldsig-php): the PHP library, Composer package `webcoder31/ezxmldsig`.
* [ezxmldsig-js](https://github.com/webcoder31/ezxmldsig-js): the Node.js library, npm package `@webcoder31/ezxmldsig`.

The site holds no API: what depends on a library (methods, options, their types) stays in its README, which the pages link to.

## Writing

* The pages are Markdown (`why.md`), or HTML for the home page (`index.html`), in the layout `_layouts/default.html`.
* `_data/nav.yml` lists the pages of the side menu, in order.
* `_data/libraries.yml` describes both libraries, and gives the earliest version of each that the pages apply to, shown at the foot of every page.
* `assets/site.css` takes its colours, its top bar and the illustration of the home page from the demos of ezxmldsig-php (`demo/public/app.css`).

## Screenshots of the demos

`assets/screenshots/token-lab.png` and `assets/screenshots/single-sign-on.png` show the two demos of ezxmldsig-php, on the home page of the site and in the READMEs of both libraries, which load them from this site: **their paths must not change**, since the README of each version published on Packagist and npm keeps them. Take them again when a demo changes, as they were taken:

* in Chrome, a window of 1400 × 900 pixels, the dark theme, the demo running on the machine (`bin/demo` and `bin/demo-sso` in ezxmldsig-php);
* the token lab: its page as it opens, with the block SignedInfo of the token selected;
* the single sign-on demo: its home page after a login on MAIL then CRM entered without a new login, the trace scrolled to its end, and the animated illustration at its last step (the three sessions open, both tokens accepted).

## Preview

```sh
bin/serve
```

The site is then at http://localhost:4000/ezxmldsig-doc/, rebuilt on every change. The script runs Jekyll in Docker with the gems of GitHub Pages (`Gemfile`), so the preview renders the pages as GitHub Pages will.

## Publishing

GitHub Pages builds the site from the branch `main`, at each push.

## License

The text of the site is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (see `LICENSE`): it may be shared and adapted, provided its author, Thierry Thiers, is credited. The libraries themselves are under the CeCILL-C license.
