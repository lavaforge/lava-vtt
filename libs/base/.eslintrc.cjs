module.exports = {
    extends: ['../../.eslintrc.json'],
    ignorePatterns: ['!**/*'],
    overrides: [
        {
            files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
            rules: {},
        },
        {
            files: ['*.ts', '*.tsx'],
            parserOptions: {
                project: true,
                tsconfigRootDir: __dirname,
                EXPERIMENTAL_useProjectService: true,
            },
            rules: {},
        },
        {
            files: ['*.js', '*.jsx'],
            rules: {},
        },
    ],
};
