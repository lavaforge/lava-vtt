module.export = {
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting',
    '../../.eslintrc.json',
  ],
  ignorePatterns: ['!**/*'],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js', '*.jsx', '*.vue'],
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
        EXPERIMENTAL_useProjectService: true, // https://github.com/typescript-eslint/typescript-eslint/issues/2094
      },
      rules: {
        'vue/multi-word-component-names': 'off',
      },
    },
  ],
};
