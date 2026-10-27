# Partner SSO troubleshooting

Partner sign-in crosses three services:

```text
Affiliate -> Auth Service -> Gleent Account -> Auth Service -> Affiliate callback
```

## Production server map

For this deployment, Affiliate and Gleent Account run on the same VM. Auth Service runs on a separate VM:

| Host | Tailscale address | Services |
| --- | --- | --- |
| `ssdnodes-6a8d4e87c2973` | `100.102.197.52` | Gleent Affiliate and Gleent Account |
| `sprinthr-saas-do` | `100.68.233.102` | Auth Service |

SSH to the first host to inspect Affiliate or Account containers; SSH to the second host to inspect Auth Service and its logs. These are the addresses observed during the incident; confirm the current VM mapping if hosts are replaced or addresses change.

## Auth Service returns 401 for Account's SSO assertion

### Symptoms

- Sign-in from `/partner/login` reaches Gleent Account but does not complete the return to Affiliate.
- Auth Service logs `401 Unauthorized` for `POST /v1/internal/sso/gleent-account/authorize`.
- The browser may end up on an Account page or back at an Affiliate login page instead of the partner dashboard.

### Likely cause: Account and Auth Service clocks are out of sync

Account signs a short-lived assertion with `iat` and `exp` claims. Auth Service validates those timestamps. If the Account VM clock is several minutes behind the Auth Service VM, the assertion appears to have been issued in the future and Auth Service rejects it. The observed assertion lifetime is 60 seconds, so even a much smaller clock difference can cause intermittent failures.

### Check time synchronization

Run these commands on both the Account VM and the Auth Service VM:

```bash
date -u
chronyc tracking
chronyc sources -v
```

In `chronyc tracking`, check that:

- `Reference ID` is a real source and `Stratum` is greater than zero.
- `System time` is close to zero.
- `Leap status` is `Normal`.

In `chronyc sources -v`, a selected source has a `^*` marker. Compare `date -u` from both VMs; the clocks should be within a few seconds. On the Account VM, Chrony is the active time service. `timedatectl` may still report `NTPSynchronized=no`, so use `chronyc tracking` and `chronyc sources -v` to check Chrony's state.

### Recover a clock that has drifted

If Chrony has a healthy selected source but the Account VM clock is still significantly wrong, run this on the Account VM during a quiet period:

```bash
sudo chronyc makestep
chronyc tracking
date -u
```

`200 OK` confirms Chrony accepted the step. A large time jump can affect scheduled jobs, timeouts, and log ordering. Confirm that `System time` is close to zero and `Leap status` is `Normal`, then compare the Account and Auth Service clocks again.

### Prevent recurrence after VM time jumps

The Account VM's Chrony configuration should allow correction after startup if the VM can be suspended and resumed with an incorrect clock. In `/etc/chrony/chrony.conf`, use:

```text
makestep 1 -1
```

If the file instead has `makestep 1 3`, back it up, change that line, and restart Chrony:

```bash
sudo cp -a /etc/chrony/chrony.conf /etc/chrony/chrony.conf.bak.$(date +%Y%m%d%H%M%S)
sudoedit /etc/chrony/chrony.conf
sudo systemctl restart chrony
chronyc tracking
```

Chrony recommends allowing stepping on later updates for systems such as VMs that can resume with an incorrect clock. Right after a restart, `chronyc tracking` can briefly show stratum 0 and `Leap status: Not synchronised`; wait for a selected source (`^*`) and `Leap status: Normal` before treating that as a persistent failure. Time steps can affect time-sensitive software, so make this configuration change during a suitable maintenance window. See the [Chrony FAQ](https://chrony-project.org/faq.html) and [Ubuntu Chrony guide](https://ubuntu.com/server/docs/how-to/networking/chrony-client/).

### If clocks are already aligned

If the internal authorization request still returns 401 with synchronized clocks, check that:

- Account's internal API key matches Auth Service's server-to-server API key.
- Account's RS256 private key matches Auth Service's configured public key.
- Account and Auth Service issuer and audience settings match.
- The Account is active and email-verified.

Do not log or paste API keys, private keys, assertions, authorization codes, or OAuth state values while troubleshooting.

## Verify the full sign-in flow

After time synchronization is healthy, start a fresh sign-in from `/partner/login`. Confirm that:

1. The internal Account authorization request no longer returns 401.
2. The browser reaches Affiliate's `/api/sso/callback`.
3. For an active, linked partner, Affiliate redirects to `/partner/dashboard`.

If Account authorization succeeds but the partner dashboard still does not open, continue with Affiliate callback state, partner linkage/status, and application-access checks.
