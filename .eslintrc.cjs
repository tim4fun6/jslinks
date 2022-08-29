module.exports = {
	root: true,
	ignorePatterns: [ 'build/**/*', 'node_modules/**/*' ],
	extends: [ 'eslint:recommended', 'prettier' ],
	parser: '@babel/eslint-parser',
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2019
	},
	env: {
		browser: true,
		es2017: true,
		jquery: true,
		node: true
	},
	globals: {
		bootstrap: 'readonly',
		DataTable: 'readonly'
	},
	rules: {
		semi: [ 'error', 'never' ],
		'no-console': 'off',
		'no-return-await': 'off',
		'no-unused-vars': [ 'error', { varsIgnorePattern: '^_' } ],
		'no-param-reassign': [ 'error', { props: false } ],
		'array-bracket-spacing': [ 'error', 'always', { objectsInArrays: true, arraysInArrays: true } ],
		'object-curly-spacing': [ 'error', 'always', { arraysInObjects: true, objectsInObjects: true } ]
	},
	overrides: [
		{
			files: [ '*.spec.js' ],
			env: {
				node: true,
				browser: true,
				es2017: true,
				jquery: true,
				mocha: true
			},
			plugins: [ 'mocha' ],
			rules: {
				'prefer-arrow-callback': 'off',
				'func-names': 'off'
			}
		}
	]
}
