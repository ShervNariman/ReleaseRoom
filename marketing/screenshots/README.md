# Approved Release Room screenshot pair

The initial X demand-validation feeler uses exactly two 1920×1080 screenshots in this order:

1. `release-room-founder-dashboard.png` — founder command center showing healthy tools but a release still blocked by missing proof
2. `release-room-evidence-room.png` — detailed evidence room showing the missing proof and the workflow for resolving it

The earlier wedge, login, and 15-second demo assets are superseded for the primary feeler. Do not substitute them without a new explicit approval from the Marketing Manager and Director of X Growth.

## Capture

Run the production server on port 3100, then:

```bash
npm run marketing:capture
```

The capture script exports the approved pair at 1920×1080 with browser chrome, cursor, animation, and caret artifacts excluded.
