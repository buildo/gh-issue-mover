'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toRepoConfig = exports.fromRepoConfig = undefined;

var _yargs = require('yargs');

var _fs = require('fs');

var _tcombValidation = require('tcomb-validation');

var _tcombValidation2 = _interopRequireDefault(_tcombValidation);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Repo = _tcombValidation2.default.interface({
  owner: _tcombValidation2.default.String,
  name: _tcombValidation2.default.String,
  token: _tcombValidation2.default.maybe(_tcombValidation2.default.String),
  rootURL: _tcombValidation2.default.maybe(_tcombValidation2.default.String)
});

var Config = _tcombValidation2.default.interface({
  fromRepo: Repo,
  toRepo: Repo
});

var configPath = _yargs.argv.config;


function fileExists(filePath) {
  try {
    return (0, _fs.statSync)(filePath).isFile();
  } catch (e) {
    return false;
  }
}

if (!configPath) {
  console.log('🤔  you need to provide a config file using', '--config'.bold);
  process.exit(1);
}

if (!fileExists(configPath)) {
  console.log('🤔  I couldn\'t find a file at ' + configPath.bold + '. Are you sure it\'s there?');
  process.exit(1);
}

function safeParseJSON(str) {
  try {
    return { json: JSON.parse(str) };
  } catch (error) {
    return { error: error };
  }
}

var configFile = (0, _fs.readFileSync)(configPath, 'utf-8');

var _safeParseJSON = safeParseJSON(configFile);

var error = _safeParseJSON.error;
var config = _safeParseJSON.json;

if (error) {
  console.log('🤔  Mmh, that doesn\'t seem to be valid JSON. Here\'s the error from the parser:\n');
  console.log('⛔️ ', error.message.split('\n')[0]);
  process.exit(1);
}

var result = _tcombValidation2.default.validate(config, Config);

if (!result.isValid()) {
  console.log('🤔  Mmh, your config doesn\'t seem valid. Here\'s the errors I found:\n');
  result.errors.forEach(function (e) {
    console.log('  ⚠️  Invalid value ' + String(e.actual).bold.red + ' supplied to ' + e.path.join('/').bold + '.', 'Expected a ' + _tcombValidation2.default.getTypeName(e.expected).bold.green);
  });
  process.exit(1);
}

var fromRepoConfig = config.fromRepo;
var toRepoConfig = config.toRepo;
exports.fromRepoConfig = fromRepoConfig;
exports.toRepoConfig = toRepoConfig;