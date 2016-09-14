import { argv } from 'yargs';
import { readFileSync, statSync } from 'fs';
import t from 'tcomb-validation';

const Repo = t.interface({
  owner: t.String,
  name: t.String,
  token: t.maybe(t.String),
  rootURL: t.maybe(t.String)
});

const Config = t.interface({
  fromRepo: Repo,
  toRepo: Repo
});

const { config: configPath } = argv;

function fileExists(filePath) {
  try {
    return statSync(filePath).isFile();
  } catch (e) {
    return false;
  }
}

if (!configPath) {
  console.log('🤔  you need to provide a config file using', `--config`.bold);
  process.exit(1);
}

if (!fileExists(configPath)) {
  console.log(`🤔  I couldn\'t find a file at ${configPath.bold}. Are you sure it's there?`);
  process.exit(1);
}

function safeParseJSON(str) {
  try {
    return { json: JSON.parse(str) };
  } catch (error) {
    return { error };
  }
}

const configFile = readFileSync(configPath, 'utf-8');

const { error, json: config } = safeParseJSON(configFile);
if (error) {
  console.log(`🤔  Mmh, that doesn't seem to be valid JSON. Here's the error from the parser:\n`);
  console.log('⛔️ ', error.message.split('\n')[0]);
  process.exit(1);
}

const result = t.validate(config, Config);

if (!result.isValid()) {
  console.log(`🤔  Mmh, your config doesn't seem valid. Here's the errors I found:\n`);
  result.errors.forEach(e => {
    console.log(
      `  ⚠️  Invalid value ${String(e.actual).bold.red} supplied to ${e.path.join('/').bold}.`,
      `Expected a ${t.getTypeName(e.expected).bold.green}`
    );
  });
  process.exit(1)
}

export const { fromRepo: fromRepoConfig, toRepo: toRepoConfig } = config;
