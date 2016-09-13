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

async function migrateIssues() {
  const fromRepo = fromGithub.repos(fromRepoConfig.owner, fromRepoConfig.name);
  const toRepo = fromGithub.repos(toRepoConfig.owner, toRepoConfig.name);

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
    migrateIssues();
  } else {
    console.log('\n👋  Ok! Goodbye!'.bold);
  }

}

try {
  process.stdout.write('\x1Bc');
  migrateIssues();
} catch (e) {
  console.log(e);
}
