[![npm](https://img.shields.io/npm/v/gh-issue-mover.svg)](https://www.npmjs.com/package/gh-issue-mover)

# 🚚  gh issue mover
A friendly CLI tool to migrate issues across GitHub and GitHub Enteprise repos.

## Features

- migrate issues one by one or in bulk using labels
- include comments, labels and assignees in the migration
- include references to the original issue and author
- close the original issue with a link to a new one
- works with both (and across) GitHub and GitHub Enterprise

## Example

| original issue  |  migrated issue |
|:---------------:|:---------------:|
| ![image](https://github.omnilab.our.buildo.io/storage/user/3/files/70e73c9e-7a5b-11e6-8cb3-00dc048ce0d7) | ![image](https://github.omnilab.our.buildo.io/storage/user/3/files/5bfe83be-7a5b-11e6-88ce-97ff474a687e) |

## Usage

Install from npm:

```sh
npm install -g gh-issue-mover
```

Then create configuration file (e.g. `config.json`) that contains two keys `fromRepo` and `toRepo`:

```json
{
  "fromRepo": {
    "owner": "buildo",
    "name": "aliniq",
    "token": "1231231231231231231231231231231231231213212312",
    "rootURL": "https://github-enterprise.example.com/api/v3"
  },
  "toRepo": {
    "owner": "buildo",
    "name": "ams",
    "token": "1231231231231231231231231231231231231213212312",
    "rootURL": "https://github-enterprise.example.com/api/v3"
  }
}
```

`owner` and `name` indentify the repos you want to migrate the issue to/from.

`token` must be a github token with read permissions on the `fromRepo` and write permissions on `toRepo`.

`rootURL` is the GitHub API endpoint (only required for GitHub Enterprise repos)

Once you have a valid `config.json`, run

```sh
gh-issue-mover --config=config.json
```

and follow the interactive prompt.
