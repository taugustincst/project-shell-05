# Lost Property Office on Google Play

The Play edition is `android/play`: a Trusted Web Activity that opens the game's site, https://taugustincst.github.io/project-shell-05/, full screen. It is the same build as Ironhold's and Chronicles of Elderon's Play editions, which Play accepted: no generated code, no Application class, and every build is checked before it can be uploaded.

- **Package**: `com.taugustincst.lostproperty`
- **Version**: 1.0.0 (versionCode 10000). The release workflow takes the version and works out the code (1.0.1 becomes 10001).
- **Checks on every change** (`.github/workflows/android.yml`): builds the release APK and bundle, `tools/check-apk.js` confirms every class the manifest names is in the app, and `tools/launch-test.sh` opens it on an Android 14 emulator and fails if it crashes.
- **Signing**: the release workflow signs with the upload key from the repository's secrets; without them it builds and checks but publishes nothing. Locally, `android/keystore.properties` (never committed) does the same.
- **If the repository is renamed**, the site's address changes: build with `-PplayPath=/new-name/`, or change the default in `android/play/build.gradle`.

## What is left, in order

These need your accounts, so they are yours.

1. **Create the app in the Play Console** with the package name `com.taugustincst.lostproperty` (it is in `android/play/build.gradle`; Play never lets it change once the first bundle is uploaded). Sales model: Paid, $2.99, no in-app products.
2. **Make an upload key, once, and keep it somewhere safe** (a password manager). On your own computer:

   ```
   keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
   base64 -w0 upload.jks
   ```

   In this repository's Settings > Secrets and variables > Actions, add `ANDROID_UPLOAD_KEYSTORE` (the base64 text), `ANDROID_UPLOAD_STORE_PASSWORD`, `ANDROID_UPLOAD_KEY_ALIAS` (`upload`) and `ANDROID_UPLOAD_KEY_PASSWORD`. Never commit the keystore or put its passwords in a file here.
3. **Build the bundle**: Actions > Release (Play bundle) > Run workflow, version `1.0.0`. It builds, checks that the app would load, and attaches `lostproperty-1.0.0-play.aab` to a GitHub release named `play-v1.0.0`.
4. **Upload it to Internal testing** and accept Play App Signing. Install it from the testing link on a phone and open it once.
5. **Vouch for the app from the site.** In Play Console > Test and release > App integrity > App signing, copy the SHA-256 of the app signing key and of the upload key. They go into `https://taugustincst.github.io/.well-known/assetlinks.json` (repository taugustincst.github.io) under `com.taugustincst.lostproperty`. Until they do, the game opens with a browser bar at the top. Claude can open that pull request once you send the two fingerprints (they are public, not secrets).
6. **App content**: privacy policy `https://taugustincst.github.io/project-shell-05/privacy.html`; ads: none; data safety, content rating and target audience as written in `store/listing.md`.
7. **Store listing**: title, short and full description from `store/listing.md`; icon `icons/icon-512.png`; feature graphic `store/feature-graphic-1024x500.png`; phone screenshots `store/screenshot-*.png` (1080 wide, in the listing's caption order).
8. **Release.** A personal developer account made after November 2023 needs a closed test with at least 12 testers for 14 days before production. Then send the release for review. Folder's evaluation fixes and playtests in `HANDOFF.md` come first.

## One decision

The game is a paid app on Play, but the same game is free to play at https://taugustincst.github.io/project-shell-05/, since the Play app opens that site. Anyone who finds the address can play without buying. Ironhold works the same way. If that matters, the web copy needs a gate (a short free sample on the web, the full game only inside the Play app); say so and it can be built.
