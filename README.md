# web-app-webmail

An OpenCloud web extension that integrates Roundcube webmail into OpenCloud via iframe with HMAC-signed autologin.

Users can configure one or more mail accounts in their OpenCloud account settings and access their mailbox directly from the OpenCloud web interface. Authentication to Roundcube is handled transparently through a signed autologin URL, so users only need to enter their IMAP credentials once.

## Features

- Roundcube webmail embedded as an iframe inside OpenCloud
- HMAC-SHA256 signed autologin URLs with expiring tokens (60s TTL)
- Support for multiple Roundcube instances (configured by the administrator)
- Users can manage multiple mail accounts per instance
- IMAP passwords are encrypted in the browser using AES-256-GCM before being stored in localStorage

## Prerequisites

- OpenCloud instance with web extension support
- One or more Roundcube instances with the `autologin.php` endpoint deployed
- A shared secret configured on both the OpenCloud plugin and the Roundcube side
- Node.js and pnpm

## Building

```bash
pnpm install
pnpm build
```

This produces the `dist/` directory containing:

```
dist/
  manifest.json
  js/
    web-app-webmail.js
    chunks/
      index.mjs
      WebmailView.mjs
```

## Installation

Copy the contents of the `dist/` directory to your OpenCloud web assets directory:

```
<opencloud-data>/web/assets/apps/webmail/
```

For example, if OpenCloud stores its data at `/var/lib/opencloud`:

```bash
mkdir -p /var/lib/opencloud/web/assets/apps/webmail
cp -r dist/* /var/lib/opencloud/web/assets/apps/webmail/
```

Restart OpenCloud after installing or updating the plugin.

## Configuration

The plugin is configured through the `manifest.json` file in the plugin directory. To add Roundcube instances, add a `config` section with an `instances` array:

```json
{
  "entrypoint": "js/web-app-webmail.js",
  "config": {
    "instances": [
      {
        "id": "main-mailserver",
        "label": "Company Mail",
        "roundcubeUrl": "https://mail.example.com",
        "sharedSecret": "your-shared-secret-here"
      }
    ]
  }
}
```

### Instance properties

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique identifier for this instance |
| `label` | string | yes | Display name shown to users in the account settings |
| `roundcubeUrl` | string (URL) | yes | Base URL of the Roundcube installation |
| `sharedSecret` | string | yes | Shared secret used for HMAC signing (must match the Roundcube `autologin.php` configuration) |

### Multiple instances

You can configure multiple Roundcube instances. Users will be able to select which instance to use when adding a mail account:

```json
{
  "entrypoint": "js/web-app-webmail.js",
  "config": {
    "instances": [
      {
        "id": "internal",
        "label": "Internal Mail",
        "roundcubeUrl": "https://mail-internal.example.com",
        "sharedSecret": "secret-for-internal"
      },
      {
        "id": "external",
        "label": "External Mail",
        "roundcubeUrl": "https://mail-external.example.com",
        "sharedSecret": "secret-for-external"
      }
    ]
  }
}
```

## How it works

### Autologin flow

1. The user adds a mail account in their OpenCloud account settings (label, IMAP username, IMAP password, Roundcube instance).
2. When the user opens the webmail view, the plugin builds a signed autologin URL:
   - A JSON payload containing the user ID, account ID, IMAP credentials, and an expiration timestamp is base64url-encoded.
   - The payload is signed with HMAC-SHA256 using the shared secret.
   - The resulting URL points to `<roundcubeUrl>/autologin.php?data=...&sig=...&ts=...`.
3. The Roundcube `autologin.php` endpoint verifies the signature and timestamp, then logs the user in.

### Credential storage

IMAP passwords are **never stored in plain text** in the browser. Before being written to localStorage, each password is encrypted using:

- **AES-256-GCM** for authenticated encryption
- **PBKDF2** with SHA-256 and 100,000 iterations for key derivation
- A random **16-byte salt** (generated once per browser, stored in localStorage)
- A random **12-byte IV** per encryption operation

The encryption key is derived from the OpenCloud user ID and the salt. This means the encrypted passwords are bound to the specific user session and browser.

> **Note:** This encryption protects credentials at rest in the browser storage (e.g. against casual inspection or data exports). It does not protect against JavaScript running in the same origin (e.g. XSS attacks or malicious browser extensions), since the key material is also accessible in the browser context.

## Related

[roundcube-opencloud-plugin](https://github.com/mschneider82/roundcube_opencloud_plugin) — Roundcube plugin that lets each user connect their personal OpenCloud Space directly from within Roundcube: save email attachments to the cloud or attach files from it.

**Article:** [From Seafile to OpenCloud: Building a Self-Hosted Webmail & Cloud Integration on Kubernetes](https://medium.com/@matthias2handy/from-seafile-to-opencloud-building-a-self-hosted-webmail-cloud-integration-on-kubernetes-a4f3bb795d6f) — background, motivation, and full setup walkthrough.

## Roundcube setup

### Autologin endpoint

This extension requires an `autologin.php` endpoint on the Roundcube side. The file is included in this repository at [`dev/docker/roundcube/autologin.php`](dev/docker/roundcube/autologin.php).

**Installation:**

1. Copy `autologin.php` into the Roundcube **public web root** (the directory containing `index.php`):

   ```bash
   cp dev/docker/roundcube/autologin.php /var/www/roundcube/public_html/autologin.php
   ```

   The exact path depends on your Roundcube installation. Common locations are `/var/www/roundcube/public_html/`, `/var/www/html/`, or `/usr/share/roundcube/`.

2. Edit `autologin.php` and set `SHARED_SECRET` to a strong random value:

   ```php
   define('SHARED_SECRET', 'your-strong-random-secret');
   ```

   This secret must match the `sharedSecret` configured in the OpenCloud `manifest.json` for the corresponding instance.

3. Verify that the endpoint is reachable at `https://your-roundcube-url/autologin.php`.

### Session lifetime

By default, Roundcube's `session_lifetime` is set to 10 minutes. Since Roundcube runs inside an iframe, an expired session will show the Roundcube login page within the iframe instead of the expected mailbox view.

To avoid this, increase the `session_lifetime` in your Roundcube `config/config.inc.php`:

```php
// Session lifetime in minutes (default: 10)
// Set to a high value since session management is handled by OpenCloud
$config['session_lifetime'] = 600; // 10 hours
```

## Development

```bash
pnpm build:w
```

This starts Vite in watch mode for development.

### Linting and formatting

```bash
pnpm lint
pnpm format:check
pnpm format:write
```

### Type checking

```bash
pnpm check:types
```

### Tests

```bash
pnpm test:unit
```

## License

Apache-2.0
