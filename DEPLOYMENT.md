# Deployment Notes

## Live Server

- Provider: OVH
- SSH alias: `ovh`
- Host: `51.79.255.226`
- User: `ubuntu`
- Port: `22`
- SSH key: `~/.ssh/ovh.pem`
- Direct SSH command: `ssh ovh`
- Live storefront: `https://perfume.mirainikki.xyz`
- Alternate domains: `https://codeinmoon.xyz`, `https://www.codeinmoon.xyz`
- Live frontend directory: `/home/ubuntu/sillage/frontend/dist`

The `ovh` entry is configured in `~/.ssh/config`:

```ssh
Host ovh    #Added by lazyssh
    HostName 51.79.255.226
    User ubuntu
    Port 22
    IdentityFile ~/.ssh/ovh.pem
```

## Project

- Local project: `/home/sine/Projects/Wordpress/react_store/frontend`
- Build: `npm run build`
- Lint: `npm run lint`
- Local WordPress URL: `https://react-store.ddev.site`
- Live WordPress/WooCommerce runs in the `ecom` Docker container on OVH.

## Required Workflow

1. Make the change in the local project.
2. Run `npm run build` and `npm run lint`.
3. Deploy the built `dist/` to OVH. Local-only changes are not sufficient for
   testing unless the user explicitly requests local-only work.
4. Before replacing the live build, create a timestamped backup such as
   `dist.backup-*`.
5. Verify the live storefront, `/cart`, and `/checkout` over HTTPS. For cart or
   checkout changes, test the complete reported flow on the live site.
6. Report the live URL and deployment result so the user can test immediately.
7. Push to GitHub only after the user confirms the live fix works.

The live VPS is the required test environment because it contains the complete
WordPress, WooCommerce, and supporting service setup that cannot be replicated
on the local device.
