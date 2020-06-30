#!/usr/bin/env node

import Octokat from 'octokat';
import inquirer from 'inquirer';
import 'colors';
import open from 'open';
import { pick } from 'lodash';
import { fromRepoConfig, toRepoConfig } from './config.js';

const fromGithub = new Octokat({
  token: fromRepoConfig.token,
  rootURL: fromRepoConfig.rootURL
});

const toGithub = new Octokat({
  token: toRepoConfig.token,
  rootURL: toRepoConfig.rootURL
});

const fromRepoName = `${fromRepoConfig.owner}/${fromRepoConfig.name}`;
const toRepoName = `${toRepoConfig.owner}/${toRepoConfig.name}`;

const fromRepo = fromGithub.repos(fromRepoConfig.owner, fromRepoConfig.name);
const toRepo = toGithub.repos(toRepoConfig.owner, toRepoConfig.name);

async function migrateComment(issue, comment) {
  const authorshipNote = `_From @${comment.user.login} on [${formatDate(comment.createdAt)}](${comment.htmlUrl})_\n\n`;
  const commentToCreate = {
    body: `${authorshipNote}\n${comment.body}`
  };
  await toRepo.issues(issue.number).comments.create(commentToCreate);
}

async function migrateIssue(issue) {
  const authorshipNote = `_From @${issue.user.login} on [${formatDate(issue.createdAt)}](${issue.htmlUrl})_\n\n`;
  const issueToCreate = {
    ...pick(issue, ['title', 'labels']),
    assignees: issue.assignees.map(a => a.login),
    body: `${authorshipNote}\n${issue.body}`
  };
  try {
    let commentsPage = await fromRepo.issues(issue.number).comments.fetch({per_page: 100});
    let comments = [...commentsPage];
    while (commentsPage.nextPage) {
      commentsPage = await commentsPage.nextPage();
      comments = [...comments, ...commentsPage];
    }
    const newIssue = await toRepo.issues.create(issueToCreate);
    if (issue.state === 'closed') {
      await newIssue.update({state: issue.state});
    }
    let commentIndex = 1;
    for (const comment of comments) {
      process.stdout.write("\r\x1b[K");
      process.stdout.write(`Migrating comment #${commentIndex++} of ${comments.length}... `);
      try {
        await migrateComment(newIssue, comment);
        await sleep(1000);
      } catch (e) {
        if (e.status === 403) {
          process.stdout.write('rate limited, waiting before trying again');
          await sleep(60000);
          await migrateComment(newIssue, comment);
        } else {
          throw e;
        }
      }
    }
    await fromRepo.issues(issue.number).comments.create({
      body: `_Migrated to ${toRepoConfig.owner}/${toRepoConfig.name}#${newIssue.number}_`
    });
    await fromRepo.issues(issue.number).update({ state: 'closed' });
    console.log(
      '\n',
      '🍭  Successfully migrated issue',
      'from',
      `${fromRepoConfig.owner}/${fromRepoConfig.name}#${issue.number}`.bold,
      'to',
      `${toRepoConfig.owner}/${toRepoConfig.name}#${newIssue.number}`.bold,
      '\n'
    );
    return newIssue;
  } catch (e) {
    console.log(`😱 Something went wrong while migrating issue #${issue.number}!`);
    console.log(JSON.stringify(e, null, 2));
  }
}

async function migrateIssuesByLabel(labels) {
  const issuesAndPRs = await fromRepo.issues.fetch({ labels, state: 'open', filter: 'all' });
  const issues = issuesAndPRs.filter(i => !i.pullRequest);

  if (issues.length === 0) {
    console.log(`Sorry, no issues found matching labels ${labels.split(', ').map(l => l.green)}`);
    const { retry } = await inquirer.prompt([{
      type: 'confirm',
      name: 'retry',
      message: 'Do you want to try again?'
    }]);
    if (retry) {
      await migrateIssues();
    }
  } else {
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      default: false,
      message: [
        `You're about to migrate`,
        `${issues.length} issues`.green,
        'matching the labels',
        labels.split(', ').map(l => l.green),
        '. Are you sure?'
      ].join(' ')
    }]);
    if (confirm) {
      await Promise.all(issues.forEach(migrateIssue));
      console.log(
        '\n',
        `🌟  Successfully migrated ${issues.length} issues`,
        'from',
        `${fromRepoConfig.owner}/${fromRepoConfig.name}`.bold,
        'to',
        `${toRepoConfig.owner}/${toRepoConfig.name}`.bold
      );
    }
  }
}

async function migrateIssuesOneByOne() {
  const { issueNumber } = await inquirer.prompt([{
    type: 'input',
    name: 'issueNumber',
    message: 'Which issue do you want to migrate? (type the #)'
  }]);
  const issue = await fromRepo.issues(issueNumber).fetch();
  console.log();
  console.log('🚀  Successfully retrieved issue', `#${issue.number}`.bold);
  console.log();
  console.log('Title:', issue.title.bold);
  console.log('Author:', issue.user.login.bold);
  console.log('State:', issue.state === 'open' ? issue.state.green.bold : issue.state.red.bold);
  console.log('Comments:', issue.comments);
  console.log();
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    default: false,
    message: [
      `You're about to migrate issue #${String(issue.number).yellow.bold} from`,
      `${fromRepoConfig.owner}/${fromRepoConfig.name}`.bold,
      'to',
      `${toRepoConfig.owner}/${toRepoConfig.name}`.bold + '.',
      'Are you sure?'
    ].join(' ')
  }]);

  if (confirm) {

    const newIssue = await migrateIssue(issue);

    const { openInBrowser } = await inquirer.prompt([{
      type: 'confirm',
      name: 'openInBrowser',
      message: 'Open new issue in browser now?'
    }]);

    if (openInBrowser) {
      open(newIssue.htmlUrl);
    }

  }

  const prefix = confirm ? 'That was fun! 💃 ' : 'Oh, I see 👀 ';

  const { anotherOne } = await inquirer.prompt([{
    type: 'confirm',
    name: 'anotherOne',
    message: `${prefix} Do you want to migrate another issue?`
  }]);

  if (anotherOne) {
    await migrateIssuesOneByOne();
  }

}

async function chooseMigrationType() {
  const { migrationType } = await inquirer.prompt([{
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

  const { labels } = await inquirer.prompt([{
    type: 'input',
    name: 'labels',
    message: 'Cool, which labels? (separate multiple labels with commas. They will go in AND)',
    when: migrationType === 'byLabel'
  }]);

  return { migrationType, labels };
}

async function migrateIssues() {
  const { migrationType, labels } = await chooseMigrationType();

  switch (migrationType) {
    case 'byLabel': await migrateIssuesByLabel(labels); break;
    case 'oneByOne': await migrateIssuesOneByOne(); break;
  }
}

async function main() {
  await migrateIssues();
  console.log('\n👋  Ok! Goodbye!'.bold);
}

function clearConsole() {
  process.stdout.write('\x1Bc');
}

function formatDate(date) {
  const dateStr = new Date(date).toISOString();
  // '2018-02-19T06:26:17.000Z' => '2018-02-19 06:26'
  return `${dateStr.slice(0, 10)} ${dateStr.slice(11, 16)}`;
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

try {
  clearConsole();
  console.log('🖖  Greetings, hooman!\n')
  console.log(`🚚  Ready to migrate issues from ${fromRepoName.bold} to ${toRepoName.bold}?\n`);
  main();
} catch (e) {
  console.log(e);
}
