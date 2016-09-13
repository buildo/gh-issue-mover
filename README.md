# issue migrator
A friendly CLI tool to migrate issues across GitHub and GitHub Enteprise repos.

## Features

- migrate issues one by one
- migrate issues in bulk using labels 

## Usage

First, install all required dependencies

```sh
npm install
```

Then create a file named `config.json` that contains two keys `fromRepo` and `toRepo`:

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

Once you have a valid `config.json`, simply run

```sh
npm start
```

and follow the interactive prompt.
