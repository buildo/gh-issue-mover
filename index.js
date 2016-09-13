import Octokat from 'octokat';
import inquirer from 'inquirer';
import 'colors';
import open from 'open';
import { omit } from 'lodash';
import { fromRepo as fromRepoConfig, toRepo as toRepoConfig } from './config.json';

const fromGithub = new Octokat({
  token: fromRepoConfig.token,
  rootURL: fromRepoConfig.rootURL
});

const toGithub = new Octokat({
  token: toRepoConfig.token,
  rootURL: toRepoConfig.rootURL
});

const fromRepo = fromGithub.repos(fromRepoConfig.owner, fromRepoConfig.name);
const toRepo = fromGithub.repos(toRepoConfig.owner, toRepoConfig.name);


async function migrateIssue(issue) {
  const authorshipNote = [
    '---',
    '',
    `Migrated from ${fromRepoConfig.owner}/${fromRepoConfig.name}#${issue.number}`,
    `Originally created by @${issue.user.login} on *${new Date(issue.createdAt).toUTCString()}*`,
    '',
    '---'
  ].join('\n');
  const issueToCreate = {
    ...omit(issue, ['assignee']),
    body: `${authorshipNote}\n${issue.body}`
  };
  const newIssue = await toRepo.issues.create(issueToCreate);
  await fromRepo.issues(issueNumber).comment.create({
    body: `Issue migrated to ${toRepoConfig.owner}/${toRepoConfig.name}#${newIssue.number}`
  });
  await fromRepo.issues(issueNumber).update({ state: 'closed' });
  console.log(
    '\n',
    '🍭  Successfully migrated issue',
    'from',
    `${fromRepoConfig.owner}/${fromRepoConfig.name}#${issue.number}`.bold,
    'to',
    `${toRepoConfig.owner}/${toRepoConfig.name}#${newIssue.number}`.bold
  );
  return newIssue;
}

async function migrateIssuesByLabel(labels) {
  const issues = await fromRepo.issues.fetch({ labels });
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    default: false,
    message: [
      `You're about to migrate`,
      `${issues.length} issues`.green,
      'matching the labels',
      labels.green
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

async function migrateIssuesOneByOne() {
  const { issueNumber } = await inquirer.prompt([{
    type: 'input',
    name: 'issueNumber',
    message: 'Which issue do you want to migrate?'
  }]);
  const issue = await fromRepo.issues(issueNumber).fetch();
  console.log();
  console.log('🚀  Successfully retrieved issue', `#${issue.number}`.bold);
  console.log();
  console.log('Title:', issue.title.bold);
  console.log('Author:', issue.user.login.bold);
  console.log('State:', issue.state === 'open' ? issue.state.green.bold : issue.state.red.bold);
  console.log();
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    default: false,
    message: [
      `You're about to migrate issue #${String(issue.number).yellow.bold} from`,
      `${fromRepoConfig.owner}/${fromRepoConfig.name}`.bold,
      'to',
      `${toRepoConfig.owner}/${toRepoConfig.name}`.bold,
      '. Are you sure?'
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
    message: 'Cool, which labels? (separate multiple labels with commas)',
    when: migrationType === 'byLabel'
  }]);

  return { migrationType, labels };
}

async function main() {
  process.stdout.write('\x1Bc');

  console.log('🖖  Greetings, hooman!\n')

  const { migrationType, labels } = await chooseMigrationType();

  switch (migrationType) {
    case 'byLabel': await migrateIssuesByLabel(labels); break;
    case 'oneByOne': await migrateIssuesOneByOne(); break;
  }

  console.log('\n👋  Ok! Goodbye!'.bold);
}

try {
  main();
} catch (e) {
  console.log(e);
}
