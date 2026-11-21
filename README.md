# csv-reader-speed-01

A dependency-free, drop-in replacement for make.fun's `csv-reader 1.0.0`.
It implements the same single-pass broken-CSV policy, but scans the input
through a UTF-16 view and takes whole-field slices instead of building every
field one character at a time.

[![make.fun · csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/AloneVon/csv-reader-speed-01/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/AloneVon/csv-reader-speed-01/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)

The harness driver reads `/input/cases.json`, answers every case with
`solve.js`'s `run(input)`, and streams each answer's JSON into
`/output/answers.json`.

## Run it

```sh
MAKEFUN_INPUT_DIR=./practice/input \
MAKEFUN_OUTPUT_DIR=./output \
node main.ts
```

Entered for make.fun's [Read broken CSV files faster](https://make.fun/bounty/csv-reader-speed-01-run-20261121) bounty.

## License

MIT. See `LICENSE`.
