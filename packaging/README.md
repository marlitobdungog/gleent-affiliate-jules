# Packaging

This directory contains the files and metadata required to build and install
the application on a local machine or a remote server.

## Quick Start

For a new application, copy this `packaging/` directory into the application
repository and configure `package.json`.

Install from the package manifest:

```sh
appctl app install --manifest-file /path/to/app/packaging/package.json --target local
```

Install on a remote SSH target:

```sh
appctl app install --manifest-file /path/to/app/packaging/package.json --target remote --ip user@example.com
```

`appctl` reads `package.json` and installs the payload directly by default.
Use `--mode portable` if you want a generated installer artifact.

For an existing application, copy only a selected template file without
replacing the whole packaging directory:

```sh
appctl package-template cp --path /path/to/app --file release.json
```

The `--file` option may be repeated. Without `--file`, the complete template
is copied as before. When adding `release.json` to an existing application,
add its payload entry to the existing `package.json` explicitly.

## Manifest

`package.json` defines the package identity and files to install.

```json
{
  "app-name": "paperless-ngx",
  "bin-name": "paperless",
  "payload": [
    {
      "source": "docker-compose.yml",
      "target": "/opt/paperless-ngx/docker-compose.yml",
      "mode": "0644"
    },
    {
      "source": "release.json",
      "target": "/etc/paperless-ngx/release.json",
      "mode": "0644",
      "owner": "root",
      "group": "paperless-ngx",
      "idempotent": false
    },
    {
      "source": ".env.example",
      "target": "/etc/paperless-ngx/.env",
      "mode": "0640",
      "owner": "root",
      "group": "paperless-ngx",
      "idempotent": true
    },
    {
      "source": "bin/{bin-name}",
      "target": "/usr/local/bin/{bin-name}",
      "mode": "0755"
    }
  ]
}
```

- `app-name`: package identity and the remote temporary directory name.
- `bin-name`: binary name used by payload entries such as `../bin/{bin-name}`.
- `payload`: files included in the installer.
- `source`: path relative to `packaging/`.
- `target`: destination path on the installed machine. Absolute paths are
  supported, and `~`, `$HOME`, or `${HOME}` may be used for user-home targets.
  The recommended application environment location is `/etc/{app-name}/.env`.
- `mode`: installed file mode, written as a string such as `"0644"`.
- `owner`: optional installed-file owner, for example `"root"`.
- `group`: optional installed-file group, for example `"let-projects"`.
- `idempotent`: optional. When `true`, an existing target file is kept instead
  of overwritten, while configured mode and ownership are still enforced.
- `output`: optional. Required only for `--mode portable`, where it defines the
  generated installer path relative to `packaging/`.

`{app-name}` and `{bin-name}` are supported in `source`, `target`, `owner`, and
`group` values.
When a target uses `~`, `$HOME`, or `${HOME}`, the installer resolves it
against the invoking user's home directory even when `sudo` is used.

## Build First

`appctl app install` does not build or generate payload files for you.
Every file referenced by `payload[].source` must already exist before install.

Typical flow:

```sh
make build-go
appctl app install --manifest-file /path/to/app/packaging/package.json --target local
```

If your manifest includes a binary payload such as `bin/{bin-name}`, place the
launcher at `packaging/bin/{bin-name}` before building the installer.

## Portable Mode

When you need a standalone installer that can be copied and run without
`appctl`, use portable mode:

```sh
appctl app install --manifest-file /path/to/app/packaging/package.json --mode portable --target remote --ip user@example.com
```

Portable mode requires `"output"` in `package.json`. The generated artifact is
written to that path, for example `packaging/dist/install.sh`. It embeds only
the files declared in `payload`; it is not necessary to copy a separate ZIP
file to a remote server.

The artifact includes the `.env` file when it is in `payload`. Treat
`packaging/dist/install.sh` as secret-bearing data: do not commit it or share
it through an untrusted channel.

The generated template also includes `release.json`. Replace its example
image references for each application release. The installer replaces this
non-secret file on upgrades and downgrades, while preserving the secret `.env`.

For production environment files under `/etc`, use explicit ownership:

```json
{
  "source": ".env.example",
  "target": "/etc/let-projects/.env",
  "mode": "0640",
  "owner": "root",
  "group": "let-projects",
  "idempotent": true
}
```

The installer creates the system group and adds the invoking deployment user
to it when needed. Start a new login session after installation so the group
membership is active. Runtime commands should be run without `sudo`, allowing
Docker to use that user's registry credentials.

On a remote install, the artifact is copied to:

```text
/tmp/<app-name>/install.sh
```

It is removed after the installer finishes.
