<div align="center">
  <h2 align="center">graphql-web-lite</h2>
  <p align="center"><strong>The small sibling of the <code>graphql</code> package, slimmed down for client-side libraries</strong></p>
  <br />
  <a href="https://npmjs.com/package/graphql-web-lite">
    <img alt="NPM Version" src="https://img.shields.io/npm/v/graphql-web-lite.svg" />
  </a>
  <a href="https://npmjs.com/package/use-interactions">
    <img alt="License" src="https://img.shields.io/npm/l/graphql-web-lite.svg" />
  </a>
  <a href="https://bundlephobia.com/result?p=graphql-web-lite">
    <img alt="Minified gzip size" src="https://img.shields.io/bundlephobia/minzip/graphql-web-lite.svg?label=gzip%20size" />
  </a>
  <br />
  <br />
</div>

The `graphql` package serves two purposes in being the reference implementation of the
[GraphQL specification](https://spec.graphql.org/) and being used as the shared toolkit
for implementing GraphQL in client-side and server-side JavaScript applications. This
can cause bloat for client-side apps, where we'd rather choose lower bundlesize impact
over fidelity.

`graphql-web-lite` provides an alias package that can be swapped in for the standard
`graphql` package in client-side applications.
It aims to reduce the size of imports that are in common use by GraphQL clients and
users, while still providing most `graphql` exports that are used in other contexts.

It replaces the default `language` exports with
[`@0no-co/graphql.web`](https://github.com/0no-co/graphql.web) for a leaner
parser, printer, and visitor, which only support the GraphQL query language and
are tested to 100% coverage and built to match GraphQL.js’ performance.

## Installation

`graphql-web-lite` mirrors the folder structure of the regular `graphql` package and
includes mostly the same files and imports as the `graphql` package, minus a couple
that aren't commonly used for client-side GraphQL.
This offers us several installation options, depending on how the package is aliased
to the regular `"graphql"` import.

<details>
<summary><strong>Installation with <code>package.json</code> aliases</strong></summary>

When your dependencies and `node_modules` folder isn't used by a _GraphQL server_ and
only used by a _GraphQL clients_, you can use a quick and easy npm installation alias.
In your `package.json` file you can define your `graphql` installation to use
`graphql-web-lite` instead, which is supported by both Yarn and npm:

```diff
{
  "dependencies": {
-    "graphql": "^15.5.0"
+    "graphql": "npm:graphql-web-lite@^15.5.1001"
  }
}
```

Alternatively, you can run an installation command to alias the package:<br />

```sh
npm install --save graphql@npm:graphql-web-lite
# or
yarn add graphql@npm:graphql-web-lite
```

When this isn't suitable — for instance, because the same dependencies are shared
with an API or server-side GraphQL consumer, or you're working inside a monorepo —
you can try one of the other aliasing techniques below.

</details>

<details>
<summary><strong>Installation with Webpack aliases</strong></summary>

First, we'll need to install `graphql-web-lite` _alongside_ the regular `graphql`
package.

```sh
npm install --save graphql-web-lite
# or
yarn add graphql-web-lite
```

To alias a package in Webpack, an entry must be added to your Webpack
configuration's `resolve.alias` section. Depending on your implementation,
the configuration may already contain some keys inside `resolve.alias`, and
you'd want to add another entry for `"graphql"`.

```js
const webpackConfig = {
  // ...
  resolve: {
    alias: {
      graphql: 'graphql-web-lite',
    },
  },
};
```

</details>

<details>
<summary><strong>Installation with Next.js</strong></summary>

First, we'll need to install `graphql-web-lite` _alongside_ the regular `graphql`
package.

```sh
npm install --save graphql-web-lite
# or
yarn add graphql-web-lite
```

In your [Next.js configuration file](https://nextjs.org/docs/api-reference/next.config.js/introduction),
under `next.config.js`, you can add an additional `webpack()` function that is
able to modify Next's Webpack configuration to add an alias for `graphql`.

```js
module.exports = {
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        graphql: 'graphql-web-lite',
      };
    }
    return config;
  },
};
```

Here we're also ensuring that the alias isn't applied on the server-side, in case
an API route is using `graphql` for a server-side GraphQL schema.

</details>

<details>
<summary><strong>Installation with Rollup's alias plugin</strong></summary>

First, we'll need to install `graphql-web-lite` _alongside_ the regular `graphql`
package.

```sh
npm install --save graphql-web-lite
# or
yarn add graphql-web-lite
```

In Rollup, the easiest way to add a new alias is to use `@rollup/plugin-alias`.
We'll have to install this plugin and ensure that every import and deep import
to `graphql` is aliased to `graphql-web-lite`.

Any Rollup-based build will fail when the import name of the package does not
match the `name` field in the module's `package.json` file, so this step is
necessary.

```js
import alias from '@rollup/plugin-alias';

module.exports = {
  plugins: [
    alias({
      entries: [{ find: 'graphql', replacement: 'graphql-web-lite' }],
    }),
  ],
};
```

</details>

<details>
<summary><strong>Installation with Vite</strong></summary>

First, we'll need to install `graphql-web-lite` _alongside_ the regular `graphql`
package.

```sh
npm install --save graphql-web-lite
# or
yarn add graphql-web-lite
```

In your [Vite configuration file](https://vitejs.dev/config/#config-file-resolving)
you may add a new entry for its `resolve.alias` entries. This entry works the same
as Rollup's alias plugin.

```js
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      graphql: 'graphql-web-lite',
    },
  },
});
```

Here we're also ensuring that the alias isn't applied on the server-side, in case
an API route is using `graphql` for a server-side GraphQL schema.

</details>

<details>
<summary><strong>Installation with Parcel</strong></summary>

First, we'll need to install `graphql-web-lite` _alongside_ the regular `graphql`
package.

```sh
npm install --save graphql-web-lite
# or
yarn add graphql-web-lite
```

In Parcel, we can add an entry in our `package.json` file for an alias. Specifically,
the `alias` property may contain an object that maps packages to their aliases.

```diff
{
  "alias": {
+    "graphql": "graphql-web-lite"
  }
}
```

</details>

<details>
<summary><strong>Installation with Jest's module mapping</strong></summary>

First, we'll need to install `graphql-web-lite` _alongside_ the regular `graphql`
package.

```sh
npm install --save graphql-web-lite
# or
yarn add graphql-web-lite
```

Jest allows any module names to be remapped using regular expression-based
mappings. In your Jest config you'll need to add an entry for `graphql` that
remaps all imports and deep imports to `graphql-web-lite`.

```json
{
  "moduleNameMapper": {
    "graphql(.*)": "graphql-web-lite$1"
  }
}
```

</details>

## Impact & Changes

In short, most utilities, functions, and classes exported by the `graphql`
package are only used for server-side GraphQL. Some of them have been removed
in `graphql-web-lite` to discourage its server-side usage, and help bundlers
exlude them if tree-shaking were to fail.

Most GraphQL clients rely on importing the parser, printer, visitor, and the
`GraphQLError` class. These have all been modified to reduce their bundlesize
impact and to remove any support for
[GraphQL's schema language and type system](https://spec.graphql.org/June2018/#sec-Type-System).

Any debugging calls, development-time warnings, and other non-production code
is also being transpiled away, and `process.env.NODE_ENV` has been compiled
away.

<details>
<summary><strong>Full List of Changes</strong></summary>

| Export                | Changes    | Notes                                                               |
| --------------------- | ---------- | ------------------------------------------------------------------- |
| `visit`               | _modified_ | works recursively and does not detect invalid AST nodes             |
| `print`               | _modified_ | won't output any schema nodes and does not detect invalid AST nodes |
| `printLocation`       | _modified_ | won't output source snippets                                        |
| `printSourceLocation` | _modified_ | won't output source snippets                                        |
| `parse`               | _modified_ | won't parse schema nodes or throw precise syntax errors             |
| `parseType`           | _modified_ | won't throw precise syntax errors                                   |
| `parseValue`          | _modified_ | won't throw precise syntax errors                                   |
| `GraphQLError`        | _modified_ | doesn't handle locations and Error stacks                           |

</details>

### Bundlesize Impact

Most GraphQL client-side libraries use the following common set of imports from the `graphql` library.
Assuming a transformation like [`babel-plugin-modular-graphql`](https://github.com/kitten/babel-plugin-modular-graphql/)
or granular imports in general this creates a short list of utilities.

```js
export { valueFromASTUntyped } from 'graphql/utilities/valueFromASTUntyped.mjs';
export { GraphQLError } from 'graphql/error/GraphQLError.mjs';
export { Kind } from 'graphql/language/kinds.mjs';
export { parse } from 'graphql/language/parser.mjs';
export { print } from 'graphql/language/printer.mjs';
export { visit } from 'graphql/language/visitor.mjs';
```

The minzipped size of the imports is about `11.2kB` in a given output bundle, which assumes all the above imports are
in use. When the GraphQL language parser is dropped from the bundle, for instance by precompiling queries and excluding
it in a compilation step, the resulting minzipped size drops to `5.55kB`.

When `graphql-web-lite` replaces the `graphql` package the minzipped size drops from the `11.2kB` figure down to `5.44kB`,
and `3.19kB` without the parser.
