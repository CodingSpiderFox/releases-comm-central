/* -*- Mode: JavaScript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Test font preference migration. This currently only makes sense on Windows --
 * however, we're able to test for all versions of Windows, regardless of which
 * version the test is run on.
 */

var {MailMigrator} = ChromeUtils.import("resource:///modules/MailMigrator.jsm");
var {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");

/**
 * A list of font names to verify using |makeVerifier| and
 * |verifier|. |makeVerifier| expects all the prefs to be passed in, while
 * |verifier| doesn't require any.
 */
var kNamesToVerify = ["serif", "sans", "monospace"];

/**
 * A list of font sizes to verify using |makeVerifier| and
 * |verifier|. |makeVerifier| expects all the prefs to be passed in, while
 * |verifier| doesn't require any. If a size is specified, however, |verifier|
 * can have the migrated and non-migrated sizes passed in separately (by
 * appending either |Migrated| or |NonMigrated| to the property name,
 * respectively).
 */
var kSizesToVerify = ["variableSize", "fixedSize"];

/**
 * A higher order function which returns a function that verifies fonts based on
 * whatever's provided in aFonts and aNonDefaultFonts.
 */
function makeVerifier(aFonts) {
  function getFont(aFontType, aEncoding) {
    var font = Services.prefs.getCharPref("font.name." + aFontType + "." + aEncoding);
    if (font)
      return font;

    // Get the default.
    var enumerator = Cc["@mozilla.org/gfx/fontenumerator;1"]
                       .createInstance(Ci.nsIFontEnumerator);
    var fonts = enumerator.EnumerateFonts(aEncoding, aFontType);
    var defaultFont = null;
    if (fonts.length > 0)
      defaultFont = enumerator.getDefaultFont(aEncoding, aFontType);
    return defaultFont;
  }

  function verifier(aEncoding, aNonDefaultFonts) {
    if (!aNonDefaultFonts)
      aNonDefaultFonts = {};

    let expectedFonts = {};
    for (let key of kNamesToVerify)
      expectedFonts[key] = (key in aNonDefaultFonts ? aNonDefaultFonts[key] :
                            aFonts[key]);
    for (let key of kSizesToVerify) {
      let nonDefaultKey = key + (aFonts.migrated ? "" : "Non") + "Migrated";
      expectedFonts[key] = (nonDefaultKey in aNonDefaultFonts ?
                            aNonDefaultFonts[nonDefaultKey] :
                            aFonts[key]);
    }

    // A distinct lack of magic here, so that failing stuff is generally easier
    // to comment out and debug.
    Assert.equal(getFont("serif", aEncoding), expectedFonts.serif);
    Assert.equal(getFont("sans-serif", aEncoding), expectedFonts.sans);
    Assert.equal(getFont("monospace", aEncoding), expectedFonts.monospace);
    Assert.equal(Services.prefs.getIntPref("font.size.variable." + aEncoding),
                 expectedFonts.variableSize);
    Assert.equal(Services.prefs.getIntPref("font.size.monospace." + aEncoding),
                 expectedFonts.fixedSize);
  }

  return verifier;
}

/**
 * Verifier function for non-ClearType fonts.
 */
var gNonCTVerifier = makeVerifier({
  serif: "Times New Roman",
  sans: "Arial",
  monospace: "Courier New",
  variableSize: 16,
  fixedSize: 13,
  migrated: false,
});

/**
 * Verifier function for ClearType fonts.
 */
var gCTVerifier = makeVerifier({
  serif: "Cambria",
  sans: "Calibri",
  monospace: "Consolas",
  variableSize: 17,
  fixedSize: 14,
  migrated: true,
});

/**
 * Windows versions to pretend we're running this on. Each value of this
 * dictionary is a pair: [Windows version, verifier for this version].
 */
var kWindowsVersions = {
  // Windows XP
  "xp": [5.1, gNonCTVerifier],
  // Windows Vista
  "vista": [6.0, gCTVerifier],
};

function set_windows_version(aVersion) {
  Services.sysinfo.QueryInterface(Ci.nsIWritablePropertyBag2)
          .setPropertyAsDouble("version", aVersion);
}

/**
 * Encodings to worry about while clearing prefs.
 */
var kEncodingsToClear = ["x-unicode", "x-western", "x-cyrillic", "el"];

/**
 * Pref branches to worry about while clearing prefs.
 */
var kPrefBranchesToClear = [
  "font.name.serif.",
  "font.name.sans-serif.",
  "font.name.monospace.",
  "font.size.variable.",
  "font.size.monospace.",
];

/**
 * Reset all font prefs we care about (as defined above) to their defaults.
 *
 * @param [aDontResetVersion] Whether mail.font.windows.version should not be
 *     reset, defaults to false.
 */
function reset_font_prefs(aDontResetVersion) {
  // kPrefBranchesToClear x kEncodingsToClear
  for (let prefBranch of kPrefBranchesToClear) {
    for (let encoding of kEncodingsToClear) {
      let pref = prefBranch + encoding;
      if (Services.prefs.prefHasUserValue(pref))
        Services.prefs.clearUserPref(pref);
    }
  }
  if (!aDontResetVersion &&
      Services.prefs.prefHasUserValue("mail.font.windows.version"))
    Services.prefs.clearUserPref("mail.font.windows.version");
}

/**
 * Test that migrating all prefs from defaults works.
 */
function test_migrating_all_prefs(aVerifier) {
  MailMigrator.migrateToClearTypeFonts();
  aVerifier("x-unicode", null);
  aVerifier("x-western", null);
  aVerifier("x-cyrillic", null);
  aVerifier("el", null);
}

/**
 * Test that if the serif font isn't a default, we don't migrate it.
 */
function test_not_migrating_serif(aVerifier) {
  // All the fonts we set are make-believe
  let nonDefaultFonts = {
    serif: "Foo Serif",
    // If we do not migrate, the font size shouldn't be clobbered at all.
    variableSizeNonMigrated: 20,
  };
  // If we do migrate, if the default style is serif, the font size shouldn't be
  // clobbered. (Otherwise it should.)
  if (Services.prefs.getCharPref("font.default.x-unicode") == "serif")
    nonDefaultFonts.variableSizeMigrated = 20;

  Services.prefs.setCharPref("font.name.serif.x-unicode", "Foo Serif");
  Services.prefs.setIntPref("font.size.variable.x-unicode", 20);

  MailMigrator.migrateToClearTypeFonts();

  aVerifier("x-unicode", nonDefaultFonts);
  aVerifier("x-western", null);
  aVerifier("x-cyrillic", null);
  aVerifier("el", null);
}

/**
 * Test that if the sans-serif font isn't a default, we don't migrate it.
 */
function test_not_migrating_sans(aVerifier) {
  let nonDefaultFonts = {
    sans: "Foo Sans",
    // If we do not migrate, the font size shouldn't be clobbered at all.
    variableSizeNonMigrated: 20,
  };
  // If we do migrate, if the default style is sans-serif, the font size
  // shouldn't be clobbered. (Otherwise it should.)
  if (Services.prefs.getCharPref("font.default.x-unicode") == "sans-serif")
    nonDefaultFonts.variableSizeMigrated = 20;

  Services.prefs.setCharPref("font.name.sans-serif.x-unicode", "Foo Sans");
  Services.prefs.setIntPref("font.size.variable.x-unicode", 20);

  MailMigrator.migrateToClearTypeFonts();

  aVerifier("x-unicode", nonDefaultFonts);
  aVerifier("x-western", null);
  aVerifier("x-cyrillic", null);
  aVerifier("el", null);
}

/**
 * Test that if the monospace font isn't a default, we don't migrate it.
 */
function test_not_migrating_monospace(aVerifier) {
  let nonDefaultFonts = {
    monospace: "Foo Mono",
    // The font size should remain what we've set it to below.
    fixedSizeMigrated: 20,
    fixedSizeNonMigrated: 20,
  };

  Services.prefs.setCharPref("font.name.monospace.x-unicode", "Foo Mono");
  Services.prefs.setIntPref("font.size.monospace.x-unicode", 20);

  MailMigrator.migrateToClearTypeFonts();

  aVerifier("x-unicode", nonDefaultFonts);
  aVerifier("x-western", null);
  aVerifier("x-cyrillic", null);
  aVerifier("el", null);
}

/**
 * Test migrating from the default fonts but from font sizes that aren't so.
 */
function test_migrating_non_default_font_sizes(aVerifier) {
  Services.prefs.setIntPref("font.size.variable.x-unicode", 20);
  Services.prefs.setIntPref("font.size.monospace.x-western", 30);
  Services.prefs.setIntPref("font.size.monospace.x-cyrillic", 50);
  Services.prefs.setIntPref("font.size.monospace.el", 70);
  Services.prefs.setIntPref("font.size.variable.tr", 80);

  MailMigrator.migrateToClearTypeFonts();

  aVerifier("x-unicode", {variableSizeNonMigrated: 20});
  aVerifier("x-western", {fixedSizeNonMigrated: 30});
  aVerifier("x-cyrillic", {fixedSizeNonMigrated: 50});
  aVerifier("el", {fixedSizeNonMigrated: 70});
}

/**
 * Test incremental migration from mail.font.windows.version = 1.
 */
function test_migrate_from_version_1(aVerifier) {
  Services.prefs.setIntPref("mail.font.windows.version", 1);
  MailMigrator.migrateToClearTypeFonts();

  // Unicode and Western shouldn't have been migrated.
  gNonCTVerifier("x-unicode", null);
  gNonCTVerifier("x-western", null);
  // These character encodings should have been migrated.
  aVerifier("x-cyrillic", null);
  aVerifier("el", null);
}

/**
 * Test that we don't attempt to migrate twice.
 */
function test_migrating_at_most_once() {
  set_windows_version(6.0);
  // Migrate once.
  MailMigrator.migrateToClearTypeFonts();
  gCTVerifier("x-unicode", null);
  gCTVerifier("x-western", null);
  gCTVerifier("x-cyrillic", null);
  gCTVerifier("el", null);

  // Now reset to defaults, but don't reset the pref that determines whether
  // we've migrated.
  reset_font_prefs(true);
  // Verify that we have all the non-ClearType fonts back.
  gNonCTVerifier("x-unicode", null);
  gNonCTVerifier("x-western", null);
  gNonCTVerifier("x-cyrillic", null);
  gNonCTVerifier("el", null);

  MailMigrator.migrateToClearTypeFonts();
  // Test that the fonts haven't changed.
  gNonCTVerifier("x-unicode", null);
  gNonCTVerifier("x-western", null);
  gNonCTVerifier("x-cyrillic", null);
  gNonCTVerifier("el", null);
}

/**
 * Test that we attempt to migrate at least once.
 */
function test_migrating_at_least_once() {
  set_windows_version(5.1);
  // Attempt to migrate -- this won't actually work because the Windows version
  // is too low.
  MailMigrator.migrateToClearTypeFonts();
  gNonCTVerifier("x-unicode", null);
  gNonCTVerifier("x-western", null);
  gNonCTVerifier("x-cyrillic", null);
  gNonCTVerifier("el", null);

  // Now reset to defaults, but don't reset the pref that determines whether
  // we've migrated.
  reset_font_prefs(true);

  // Move to Vista
  set_windows_version(6.0);

  MailMigrator.migrateToClearTypeFonts();
  // Test that we get the ClearType fonts.
  gCTVerifier("x-unicode", null);
  gCTVerifier("x-western", null);
  gCTVerifier("x-cyrillic", null);
  gCTVerifier("el", null);
}

/**
 * List of tests to run for every Windows version specified in
 * |kWindowsVersions|. These tests get passed in one argument, which is a
 * callback to verify fonts (generally a different one per Windows version).
 */
var testsForEveryVersion = [
  test_migrating_all_prefs,
  test_not_migrating_serif,
  test_not_migrating_sans,
  test_not_migrating_monospace,
  test_migrating_non_default_font_sizes,
];

/**
 * Other tests to run. These tests are considered independent and do not have
 * any arguments. Also, there are no guarantees about the Windows version prior
 * to the test, so it is recommended that tests here set it right at the
 * beginning.
 */
var otherTests = [
  test_migrating_at_most_once,
  test_migrating_at_least_once,
];

function run_test() {
  reset_font_prefs();

  for (let [version, verifier] of Object.values(kWindowsVersions)) {
    set_windows_version(version);

    for (let test of testsForEveryVersion) {
      test(verifier);
      reset_font_prefs();
    }
  }

  for (let test of otherTests) {
    test();
    reset_font_prefs();
  }
}
