export const SITE = "The Charge Ledger";
export const STANDFIRST =
  "A sourced record of the financial-rules cases involving Manchester City: what was alleged, " +
  "what was decided and by whom, and what happens next.";
export const KEEPER = "Rowan Flynn";
// Where the site is published. Feeds and link previews need the full address.
export const ADDRESS = "https://rowanflynnpilot.github.io/mancity-charge-ledger/";
// The record's own feed of new entries, written by the build.
export const ATOM_FILE = "atom.xml";
export const REPO = "https://github.com/RowanFlynnPilot/mancity-charge-ledger";
// Every change to the record is a commit that touches data/. The press feed is
// committed by a workflow every hour, so it lives in feed/ and stays out of this history.
export const EDIT_HISTORY = `${REPO}/commits/main/data`;
// The terms for reusing the record: CC BY 4.0, and what it does not cover.
export const LICENCE = `${REPO}/blob/main/LICENSE-DATA.md`;
