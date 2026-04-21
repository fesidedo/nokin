# Nikon Source Page Table Layouts

This document captures the observed table structure of each Nikon source page so ingestion can be designed once and extended safely.

Primary source index:
- `http://www.photosynthesis.co.nz/nikon/`

Identity note:
- Section headers on source pages are treated as presentation metadata, not stable identity.
- Stable identity is derived from normalized lens attributes (type + focal + aperture with collision disambiguation).

## 1) `lenses.html` (summary page)

Purpose:
- Combined summary view of serial/spec/accessory data for lenses.

Navigation groups:
- Prime and specialty groups (`Fisheye`, `20`, `24`, `28`, `35`, `50-58 fast`, etc.)
- Zoom groups (`14..24-xx`, `xx-70 Pro`, etc.)
- Other families (`PC`, `Micro`, `TC`, `Z Prime`, `DX Digital`, `1 NIKKOR`, etc.)

Primary table columns (repeated by section):
- `Type`
- `Lens`
- `Serial No`
- `Date`
- `Notes`
- `Optic`
- `Angle`
- `Bl`
- `Close Focus`
- `Macro`
- `Focus Throw`
- `Filter`
- `Diam`
- `Length`
- `Weight`
- `Hood`

Format characteristics:
- One long table per section with repeated headers.
- Many cells contain ranges, uncertainty markers, and compact notation.

## 2) `serialno.html` (lens versions and serial numbers)

Purpose:
- Detailed version/sub-version history and serial ranges.

Primary table columns:
- `Type`
- `Lens`
- `Country`
- `Scr`
- `Notes`
- `Start No`
- `Confirmed`
- `End No`
- `Qty`
- `Date`

Format characteristics:
- Most granular versioning page.
- Multiple rows may exist for what looks like one lens family.
- Includes early/prototype rows and unusual numbering conventions.

## 3) `specs.html` (lens specifications)

Purpose:
- Detailed optical and mechanical specs.

Primary table columns:
- `Type`
- `Lens`
- `Optic`
- `Angle`
- `Angle DX`
- `f/`
- `Bl`
- `Close Focus`
- `Macro`
- `Focus Throw`
- `Filter`
- `Diam`
- `Length`
- `Total Length`
- `Weight`
- `Features`

Format characteristics:
- Sectioned similarly to `lenses.html`.
- Most values are compact encoded strings and ranges.
- `Features` contains tokenized abbreviations (`IF`, `ED`, `As`, `MA`, `N`, etc.).

## 4) `accessory.html` (lens accessories)

Purpose:
- Filter/hood/case/teleconverter compatibility per lens.

Primary table columns:
- `Type`
- `Lens`
- `Filter`
- `Hood`
- `Alt Hood`
- `Case`
- `201`
- `301`
- `14A`
- `14B`
- `14E`
- `20E`
- `Other`

Format characteristics:
- Repeats same section structure as other lens pages.
- `201/301/14A/14B/14E/20E` are compatibility indicator columns.
- Compatibility uses compact markers (for example `o`, `u`, `v`, `r`, `a`) that should be preserved as raw values and decoded later.

## 5) `camera.html` (Nikon cameras)

Purpose:
- Camera serial and high-level spec summary (currently under development).

Section groups:
- `Manual Focus`, `AF`, `Pro DSLR`, `Advanced`, `Mid range`, `Upper Entry`, `Entry level`, `Z Mirrorless`.

Primary display schema:
- Conceptually a 13-field camera row:
  - `Camera`
  - `Serial No`
  - `Sensor`
  - `ISO`
  - `Shutter`
  - `Finder`
  - `Screen`
  - `Storage`
  - `FPS`
  - `Features`
  - `Size`
  - `Weight`
  - `Battery`

Format characteristics:
- Dense, compact rows with nested/range data in many columns.
- Includes lens-relevant capability hints in `Features` (for example `AF`, `AI`, `Pre-AI`, `E`).

## 6) `aimod.html` (AI conversions)

Purpose:
- Historical/contextual info and AI conversion compatibility.

Observed structure:
- Mostly narrative text.
- Includes tabular content for:
  - supplier lists (`Company`, `Notes`, `Location`, `Contact`)
- The core AI conversion compatibility matrix appears to be text/table mixed and may require dedicated extraction rules.

## 7) `trade.html` (items for sale)

Purpose:
- Sale listings and AI kit availability.

Observed tables:
- AI conversion kits table:
  - `AI kit`, `Description`, `Serial no`
- Accessories sale table:
  - `Item`, `Grade`, `Description`, `Price`

Note:
- This page is less canonical for historical catalog ingestion and can be treated as optional/non-core dataset.

## 8) Shared structure patterns across lens pages

Pages sharing similar section/table patterns:
- `lenses.html`
- `serialno.html`
- `specs.html`
- `accessory.html`

Common anchors:
- Section/category labels (for example `Fisheye`, `24`, `14..24-xx`, etc.)
- Core pair: `Type` + `Lens`

These repeated patterns are the strongest signal for designing a generic, multi-page parser.

## 9) Merge strategy note for v1 lens dataset

Primary merge for first implementation slice:
- Merge `lenses.html` and `specs.html` into one canonical lens record per stable ID.

Field intent:
- `lenses.html` contributes summary timeline fields (serial/date/notes/high-level dimensions).
- `specs.html` contributes technical optical/mechanical detail (`Angle DX`, `Total Length`, `Features`, etc.).

Other pages:
- `serialno.html` and `accessory.html` are linked next as enrichment layers using the same stable ID policy.
