# Changelog

## [0.1.6](https://github.com/panbanda/c4/compare/c4-v0.1.5...c4-v0.1.6) (2026-01-11)


### Features

* implement build command with real parser and exporter ([ec6ad43](https://github.com/panbanda/c4/commit/ec6ad4369f1ea40e3bcc65b930227124acd9fc75))


### Performance

* optimize get_element from O(n) to O(1) lookup ([485b43d](https://github.com/panbanda/c4/commit/485b43dbb86bac456585163a3822cdf8d5503b85))

## [0.1.5](https://github.com/panbanda/c4/compare/c4-v0.1.4...c4-v0.1.5) (2026-01-08)


### Features

* add C4 model generator Claude plugin ([c850b58](https://github.com/panbanda/c4/commit/c850b586778bdd11e99d650edc7ffb8da47d3f2f))
* add C4 model generator Claude plugin ([9a53702](https://github.com/panbanda/c4/commit/9a53702e0132f02ea578d918290eb5aae5d36a08))
* **frontend:** improve canvas UX and remove edit mode ([066ce5f](https://github.com/panbanda/c4/commit/066ce5fb08e9913632354a45e812a0daab3e6887))
* **frontend:** improve UX with unified search, flow visualization, and edge styling ([bd02663](https://github.com/panbanda/c4/commit/bd02663cab219d165385f078cc48aab2b354b058))


### Bug Fixes

* **frontend:** remove PropertyEditor and FormField components ([26252f2](https://github.com/panbanda/c4/commit/26252f21175fccf0e77605823a7ea7f03c547e06))

## [0.1.4](https://github.com/panbanda/c4/compare/c4-v0.1.3...c4-v0.1.4) (2026-01-08)


### Features

* C4 architecture visualization tool ([fdf48cd](https://github.com/panbanda/c4/commit/fdf48cd33b07c2b8d190e1d0ffdcf2f3af82d0d0))
* **frontend:** add keyboard shortcuts and command palette ([134caa3](https://github.com/panbanda/c4/commit/134caa339e0c4a6da11f985ae32f5d7291b77bdd))
* **frontend:** add test coverage enforcement with CI/CD ([c8d63b8](https://github.com/panbanda/c4/commit/c8d63b88044658dececc497b085af9b79a8f801b))
* **server:** implement serve command with static asset serving ([f94c3a6](https://github.com/panbanda/c4/commit/f94c3a67e943795cc3b26ad21f75d24a647eaafb))


### Bug Fixes

* **frontend:** move early returns after hooks in ViewModeSwitcher ([6811ba2](https://github.com/panbanda/c4/commit/6811ba25973cb1d428687bedd4dec2542ceca809))
* **frontend:** remove unused focusElement import in CommandPalette ([1039a3e](https://github.com/panbanda/c4/commit/1039a3ef71431b21d051e9fb71f621189a3d2a8c))
* resolve CI failures for formatting and macOS tests ([3c5c670](https://github.com/panbanda/c4/commit/3c5c670011b85e5520bf4a29910e06fd525ca4cc))
* use is_some_and instead of map_or for clippy ([f45684f](https://github.com/panbanda/c4/commit/f45684f903c876f07d28c97cfb27f60f4ac9ddc2))


### Documentation

* add project development instructions ([9bb0c32](https://github.com/panbanda/c4/commit/9bb0c3231207a99ba910dea863f442efc29027c2))

## [0.1.3](https://github.com/panbanda/c4/compare/c4-v0.1.2...c4-v0.1.3) (2026-01-07)


### Bug Fixes

* **ci:** generate homebrew formula manually like omen ([ae863ac](https://github.com/panbanda/c4/commit/ae863accbb1e16789d10854662353353367234ae))

## [0.1.2](https://github.com/panbanda/c4/compare/c4-v0.1.1...c4-v0.1.2) (2026-01-07)


### Bug Fixes

* **ci:** use correct homebrew token secret name ([240b852](https://github.com/panbanda/c4/commit/240b8523ae2880709989d3ce5f3f7887aebd86a6))

## [0.1.1](https://github.com/panbanda/c4/compare/c4-v0.1.0...c4-v0.1.1) (2026-01-07)


### Features

* add example workspaces ([fd26b43](https://github.com/panbanda/c4/commit/fd26b43300ddcccd56d5ead0324c9c2ae34d5b03))
* add YAML schema validation ([65eeb50](https://github.com/panbanda/c4/commit/65eeb50555cd0e20266f1e7f4246d3ff9bc8837c))


### Bug Fixes

* **ci:** use correct rust-toolchain action and add Node.js setup ([9be7c78](https://github.com/panbanda/c4/commit/9be7c7892331f5ee16e808ff19b7d8f35d15a640))
* resolve clippy warnings ([b6af99f](https://github.com/panbanda/c4/commit/b6af99f8303b3929107002b84df6b925c93f667c))
* wire up validate command to use parser ([c49f5af](https://github.com/panbanda/c4/commit/c49f5af93e98fb6c98e56bbcb7bbe92128359756))
