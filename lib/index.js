#!/usr/bin/env node
'use strict';

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var migrateComment = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(issue, comment) {
    var authorshipNote, commentToCreate;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            authorshipNote = ['---', '', 'Migrated from ' + comment.htmlUrl, 'Originally created by @' + comment.user.login + ' on *' + new Date(comment.createdAt).toUTCString() + '*', '', '---'].join('\n');
            commentToCreate = {
              body: authorshipNote + '\n' + comment.body
            };
            _context.next = 4;
            return toRepo.issues(issue.number).comments.create(commentToCreate);

          case 4:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function migrateComment(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var migrateIssue = function () {
  var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(issue) {
    var _this = this;

    var authorshipNote, issueToCreate, _ret;

    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            authorshipNote = ['---', '', 'Migrated from ' + issue.htmlUrl, 'Originally created by @' + issue.user.login + ' on *' + new Date(issue.createdAt).toUTCString() + '*', '', '---'].join('\n');
            issueToCreate = (0, _extends3.default)({}, (0, _lodash.pick)(issue, ['title', 'labels']), {
              assignees: issue.assignees.map(function (a) {
                return a.login;
              }),
              body: authorshipNote + '\n' + issue.body
            });
            _context3.prev = 2;
            return _context3.delegateYield(_regenerator2.default.mark(function _callee2() {
              var newIssue, comments;
              return _regenerator2.default.wrap(function _callee2$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      _context2.next = 2;
                      return toRepo.issues.create(issueToCreate);

                    case 2:
                      newIssue = _context2.sent;
                      _context2.next = 5;
                      return fromRepo.issues(issue.number).comments.fetch();

                    case 5:
                      comments = _context2.sent;
                      _context2.next = 8;
                      return Promise.all(comments.map(function (c) {
                        return migrateComment(newIssue, c);
                      }));

                    case 8:
                      _context2.next = 10;
                      return fromRepo.issues(issue.number).comments.create({
                        body: 'Issue migrated to ' + _config.toRepoConfig.owner + '/' + _config.toRepoConfig.name + '#' + newIssue.number
                      });

                    case 10:
                      _context2.next = 12;
                      return fromRepo.issues(issue.number).update({ state: 'closed' });

                    case 12:
                      console.log('\n', '🍭  Successfully migrated issue', 'from', (_config.fromRepoConfig.owner + '/' + _config.fromRepoConfig.name + '#' + issue.number).bold, 'to', (_config.toRepoConfig.owner + '/' + _config.toRepoConfig.name + '#' + newIssue.number).bold, '\n');
                      return _context2.abrupt('return', {
                        v: newIssue
                      });

                    case 14:
                    case 'end':
                      return _context2.stop();
                  }
                }
              }, _callee2, _this);
            })(), 't0', 4);

          case 4:
            _ret = _context3.t0;

            if (!((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object")) {
              _context3.next = 7;
              break;
            }

            return _context3.abrupt('return', _ret.v);

          case 7:
            _context3.next = 13;
            break;

          case 9:
            _context3.prev = 9;
            _context3.t1 = _context3['catch'](2);

            console.log('😱 Something went wrong while migrating issue #' + issue.number + '!');
            console.log(JSON.stringify(_context3.t1, null, 2));

          case 13:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this, [[2, 9]]);
  }));

  return function migrateIssue(_x3) {
    return _ref2.apply(this, arguments);
  };
}();

var migrateIssuesByLabel = function () {
  var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(labels) {
    var issuesAndPRs, issues, _ref4, retry, _ref5, confirm;

    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return fromRepo.issues.fetch({ labels: labels, state: 'open', filter: 'all' });

          case 2:
            issuesAndPRs = _context4.sent;
            issues = issuesAndPRs.filter(function (i) {
              return !pull_request;
            });

            if (!(issues.length === 0)) {
              _context4.next = 15;
              break;
            }

            console.log('Sorry, no issues found matching labels ' + labels.split(', ').map(function (l) {
              return l.green;
            }));
            _context4.next = 8;
            return _inquirer2.default.prompt([{
              type: 'confirm',
              name: 'retry',
              message: 'Do you want to try again?'
            }]);

          case 8:
            _ref4 = _context4.sent;
            retry = _ref4.retry;

            if (!retry) {
              _context4.next = 13;
              break;
            }

            _context4.next = 13;
            return migrateIssues();

          case 13:
            _context4.next = 23;
            break;

          case 15:
            _context4.next = 17;
            return _inquirer2.default.prompt([{
              type: 'confirm',
              name: 'confirm',
              default: false,
              message: ['You\'re about to migrate', (issues.length + ' issues').green, 'matching the labels', labels.split(', ').map(function (l) {
                return l.green;
              }), '. Are you sure?'].join(' ')
            }]);

          case 17:
            _ref5 = _context4.sent;
            confirm = _ref5.confirm;

            if (!confirm) {
              _context4.next = 23;
              break;
            }

            _context4.next = 22;
            return Promise.all(issues.forEach(migrateIssue));

          case 22:
            console.log('\n', '🌟  Successfully migrated ' + issues.length + ' issues', 'from', (_config.fromRepoConfig.owner + '/' + _config.fromRepoConfig.name).bold, 'to', (_config.toRepoConfig.owner + '/' + _config.toRepoConfig.name).bold);

          case 23:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function migrateIssuesByLabel(_x4) {
    return _ref3.apply(this, arguments);
  };
}();

var migrateIssuesOneByOne = function () {
  var _ref6 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5() {
    var _ref7, issueNumber, issue, _ref8, confirm, newIssue, _ref9, openInBrowser, prefix, _ref10, anotherOne;

    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return _inquirer2.default.prompt([{
              type: 'input',
              name: 'issueNumber',
              message: 'Which issue do you want to migrate? (type the #)'
            }]);

          case 2:
            _ref7 = _context5.sent;
            issueNumber = _ref7.issueNumber;
            _context5.next = 6;
            return fromRepo.issues(issueNumber).fetch();

          case 6:
            issue = _context5.sent;

            console.log();
            console.log('🚀  Successfully retrieved issue', ('#' + issue.number).bold);
            console.log();
            console.log('Title:', issue.title.bold);
            console.log('Author:', issue.user.login.bold);
            console.log('State:', issue.state === 'open' ? issue.state.green.bold : issue.state.red.bold);
            console.log();
            _context5.next = 16;
            return _inquirer2.default.prompt([{
              type: 'confirm',
              name: 'confirm',
              default: false,
              message: ['You\'re about to migrate issue #' + String(issue.number).yellow.bold + ' from', (_config.fromRepoConfig.owner + '/' + _config.fromRepoConfig.name).bold, 'to', (_config.toRepoConfig.owner + '/' + _config.toRepoConfig.name).bold, '. Are you sure?'].join(' ')
            }]);

          case 16:
            _ref8 = _context5.sent;
            confirm = _ref8.confirm;

            if (!confirm) {
              _context5.next = 27;
              break;
            }

            _context5.next = 21;
            return migrateIssue(issue);

          case 21:
            newIssue = _context5.sent;
            _context5.next = 24;
            return _inquirer2.default.prompt([{
              type: 'confirm',
              name: 'openInBrowser',
              message: 'Open new issue in browser now?'
            }]);

          case 24:
            _ref9 = _context5.sent;
            openInBrowser = _ref9.openInBrowser;


            if (openInBrowser) {
              (0, _open2.default)(newIssue.htmlUrl);
            }

          case 27:
            prefix = confirm ? 'That was fun! 💃 ' : 'Oh, I see 👀 ';
            _context5.next = 30;
            return _inquirer2.default.prompt([{
              type: 'confirm',
              name: 'anotherOne',
              message: prefix + ' Do you want to migrate another issue?'
            }]);

          case 30:
            _ref10 = _context5.sent;
            anotherOne = _ref10.anotherOne;

            if (!anotherOne) {
              _context5.next = 35;
              break;
            }

            _context5.next = 35;
            return migrateIssuesOneByOne();

          case 35:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function migrateIssuesOneByOne() {
    return _ref6.apply(this, arguments);
  };
}();

var chooseMigrationType = function () {
  var _ref11 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6() {
    var _ref12, migrationType, _ref13, labels;

    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return _inquirer2.default.prompt([{
              type: 'list',
              name: 'migrationType',
              message: 'How do you want to migrate the issues?',
              choices: [{
                name: 'one by one',
                value: 'oneByOne'
              }, {
                name: 'by label',
                value: 'byLabel'
              }]
            }]);

          case 2:
            _ref12 = _context6.sent;
            migrationType = _ref12.migrationType;
            _context6.next = 6;
            return _inquirer2.default.prompt([{
              type: 'input',
              name: 'labels',
              message: 'Cool, which labels? (separate multiple labels with commas. They will go in AND)',
              when: migrationType === 'byLabel'
            }]);

          case 6:
            _ref13 = _context6.sent;
            labels = _ref13.labels;
            return _context6.abrupt('return', { migrationType: migrationType, labels: labels });

          case 9:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function chooseMigrationType() {
    return _ref11.apply(this, arguments);
  };
}();

var migrateIssues = function () {
  var _ref14 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7() {
    var _ref15, migrationType, labels;

    return _regenerator2.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.next = 2;
            return chooseMigrationType();

          case 2:
            _ref15 = _context7.sent;
            migrationType = _ref15.migrationType;
            labels = _ref15.labels;
            _context7.t0 = migrationType;
            _context7.next = _context7.t0 === 'byLabel' ? 8 : _context7.t0 === 'oneByOne' ? 11 : 14;
            break;

          case 8:
            _context7.next = 10;
            return migrateIssuesByLabel(labels);

          case 10:
            return _context7.abrupt('break', 14);

          case 11:
            _context7.next = 13;
            return migrateIssuesOneByOne();

          case 13:
            return _context7.abrupt('break', 14);

          case 14:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, this);
  }));

  return function migrateIssues() {
    return _ref14.apply(this, arguments);
  };
}();

var main = function () {
  var _ref16 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee8() {
    return _regenerator2.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.next = 2;
            return migrateIssues();

          case 2:
            console.log('\n👋  Ok! Goodbye!'.bold);

          case 3:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function main() {
    return _ref16.apply(this, arguments);
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

var _config = require('./config.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fromGithub = new _octokat2.default({
  token: _config.fromRepoConfig.token,
  rootURL: _config.fromRepoConfig.rootURL
});

var toGithub = new _octokat2.default({
  token: _config.toRepoConfig.token,
  rootURL: _config.toRepoConfig.rootURL
});

var fromRepoName = _config.fromRepoConfig.owner + '/' + _config.fromRepoConfig.name;
var toRepoName = _config.toRepoConfig.owner + '/' + _config.toRepoConfig.name;

var fromRepo = fromGithub.repos(_config.fromRepoConfig.owner, _config.fromRepoConfig.name);
var toRepo = fromGithub.repos(_config.toRepoConfig.owner, _config.toRepoConfig.name);

try {
  process.stdout.write('\x1Bc');
  console.log('🖖  Greetings, hooman!\n');
  console.log('🚚  Ready to migrate issues from ' + fromRepoName.bold + ' to ' + toRepoName.bold + '?\n');
  main();
} catch (e) {
  console.log(e);
}