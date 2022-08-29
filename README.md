# jslinks

Questions are e burden for others; answers, a prison for oneself.

## Building and publishing

You can work on the files as they are in the root directory.

These are support files and libraries:

* `ColReorderWithResize.js` --  Datatables plugin (someone else's code)

* `colResize.js` -- Datatables plugin (someone else' code)

* `gramjs.js` -- GramJS library (someone else's code)

* `jqueryPatch.js` -- A patch to jQwery to fix misbehavior on touchscreens.  I dont' remember why this is here.                                       |

You probably don't want to edit the support fies or libraries (and in
the case of `gramjs.js`, you really shouldn't since it's been obfuscated
and minimzed).

These are the app proper:

* `main.js` -- The main app logic.

* `scraper.js` -- The scraper logic that integrates with Telegram.

* `tagConfig.js` -- Once upon a time this connected all the rooms I had visited with a tag as well as a room number. Room numbers have all changed.

* `ui.js` --                    The user interface code.


## Preparing to develop

Install Node.  Then, to install the dependencies, run

```npm install```

## Developing

You can work on the files in the root directory, and the `index.html`
refers to all the un-compressed, un-garbled, un-minified source code
correctly.  To build and deploy it, run the `build.sh` script.  This
will copy and bundle all the source files into a `dist/` directory.

Development is easiest if you run a simple web server.  There's one
included in the dependencies, and you can start it running on port 8888
like so:

```
static -p 8888
```

If you don't have your PATH set up to include `node_modules/.bin`, you
can also access it through the alias `npm run serve`

## Building

Run the script `build.sh` (also aliased as `npm run build`) It will
prepare the source code files, and bundle and package them, putting the
result in the `dist/` directory.

## publishing

Run the script `publish.sh` (also aliased as `npm run publish`)  It will
publish the built files from `dist/` to the Surge workspace.  (You will
need credentials for your own workspace, which you can get from [`surge.sh`](https://www.surge.sh)