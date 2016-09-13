'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var migrateIssues = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
    var fromRepo, toRepo, _ref2, issueNumber, issue, _ref3, confirm, authorshipNote, issueToCreate, newIssue, _ref4, openInBrowser, prefix, _ref5, anotherOne;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            fromRepo = fromGithub.repos(_config.fromRepo.owner, _config.fromRepo.name);
            toRepo = fromGithub.repos(_config.toRepo.owner, _config.toRepo.name);
            _context.next = 4;
            return _inquirer2.default.prompt([{
              type: 'input',
              name: 'issueNumber',
              message: 'Which issue do you want to migrate?'
            }]);

          case 4:
            _ref2 = _context.sent;
            issueNumber = _ref2.issueNumber;
            _context.next = 8;
            return fromRepo.issues(issueNumber).fetch();

          case 8:
            issue = _context.sent;

            console.log();
            console.log('🚀  Successfully retrieved issue', ('#' + issue.number).bold);
            console.log();
            console.log('Title:', issue.title.bold);
            console.log('Author:', issue.user.login.bold);
            console.log('State:', issue.state === 'open' ? issue.state.green.bold : issue.state.red.bold);
            console.log();
            _context.next = 18;
            return _inquirer2.default.prompt([{
              type: 'confirm',
              name: 'confirm',
              default: false,
              message: ['You\'re about to migrate issue #' + String(issue.number).yellow.bold + ' from', (_config.fromRepo.owner + '/' + _config.fromRepo.name).bold, 'to', (_config.toRepo.owner + '/' + _config.toRepo.name).bold, '. Are you sure?'].join(' ')
            }]);

          case 18:
            _ref3 = _context.sent;
            confirm = _ref3.confirm;

            if (!confirm) {
              _context.next = 32;
              break;
            }

            authorshipNote = ['---', '', 'Migrated from ' + _config.fromRepo.owner + '/' + _config.fromRepo.name + '#' + issue.number, 'Originally created by @' + issue.user.login + ' on *' + new Date(issue.createdAt).toUTCString() + '*', '', '---'].join('\n');
            issueToCreate = _extends({}, (0, _lodash.omit)(issue, ['assignee']), {
              body: authorshipNote + '\n' + issue.body
            });
            _context.next = 25;
            return toRepo.issues.create(issueToCreate);

          case 25:
            newIssue = _context.sent;

            console.log('\n', '🍭  Successfully migrated issue', 'from', (_config.fromRepo.owner + '/' + _config.fromRepo.name + '#' + issue.number).bold, 'to', (_config.toRepo.owner + '/' + _config.toRepo.name + '#' + newIssue.number).bold);

            _context.next = 29;
            return _inquirer2.default.prompt([{
              type: 'confirm',
              name: 'openInBrowser',
              message: 'Open new issue in browser now?'
            }]);

          case 29:
            _ref4 = _context.sent;
            openInBrowser = _ref4.openInBrowser;


            if (openInBrowser) {
              (0, _open2.default)(newIssue.htmlUrl);
            }

          case 32:
            prefix = confirm ? 'That was fun! 💃 ' : 'Oh, I see 👀 ';
            _context.next = 35;
            return _inquirer2.default.prompt([{
              type: 'confirm',
              name: 'anotherOne',
              message: prefix + ' Do you want to migrate another issue?'
            }]);

          case 35:
            _ref5 = _context.sent;
            anotherOne = _ref5.anotherOne;


            if (anotherOne) {
              migrateIssues();
            } else {
              console.log('\n👋  Ok! Goodbye!'.bold);
            }

          case 38:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function migrateIssues() {
    return _ref.apply(this, arguments);
  };
}();

var _octokat = require('octokat');

var _octokat2 = _interopRequireDefault(_octokat);

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

require('colors');

var _open = require('open');

var _open2 = _interopRequireDefault(_open);

var _lodash = require('lodash');

var _config = require('./config.json');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

require("babel-polyfill");

var fromGithub = new _octokat2.default({
  token: _config.fromRepo.token,
  rootURL: _config.fromRepo.rootURL
});

var toGithub = new _octokat2.default({
  token: _config.toRepo.token,
  rootURL: _config.toRepo.rootURL
});

try {
  migrateIssues();
} catch (e) {
  console.log(e);
}