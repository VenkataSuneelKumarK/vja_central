# App Store & Play Store Release Checklist

This cannot be completed by an automated build — it needs an Apple
Developer account, a Google Play Console account, and content decisions
only the campaign/communications team can make (screenshots, description
copy, support URL). This checklist tracks what's ready vs. what's still
needed.

## Android (Google Play)

- [x] Application ID configurable via `app.config.ts` (`com.vjacentral.app`)
- [x] `.gitignore` excludes keystores (`*.keystore`) and Gradle build output
- [ ] Generate an upload keystore (`keytool -genkeypair …`) and store it +
      its password in a password manager / CI secret store, never in git
- [ ] `eas build --platform android --profile production` to produce the
      `.aab` (EAS handles signing once the keystore is uploaded to EAS, or
      bring your own via `credentials.json`)
- [ ] Play Store listing: short description, full description, feature
      graphic (1024×500), at least 2 phone screenshots, app icon (512×512)
- [ ] Privacy Policy URL (point at the admin-portal-served
      `/privacy-policy` page — content comes from `AppSettings.privacyPolicyUrl`)
- [ ] Data Safety form: with the Praja Samvad grievance module, the app now
      **does** collect personal data — citizen account username, mobile
      number, optional full name, plus whatever a citizen includes in a
      grievance heading/description/location/photos. Declare: mobile number
      (account creation, not shared with third parties, user can request
      deletion), name (optional, account creation), and photos (grievance
      attachments, user-submitted). Passwords are hashed and never
      transmitted or stored in plaintext. This replaces the earlier
      no-personal-data assumption from before this module existed.
- [ ] Content rating questionnaire (civic/informational content —
      typically rates "Everyone")
- [ ] Target API level meets Play's current minimum (re-check at build
      time against Play's published requirement)

## iOS (App Store)

- [x] Bundle Identifier configurable via `app.config.ts` (`com.vjacentral.app`)
- [ ] Apple Developer Program enrollment, App ID + provisioning profile
      (EAS can manage this automatically with `eas build --platform ios`)
- [ ] App Store Connect listing: name, subtitle, keywords, description,
      support URL, marketing URL (optional)
- [ ] Screenshots for at least one required device size per Apple's current
      requirement (iPhone + iPad, since `supportsTablet: true`)
- [ ] App Privacy "nutrition label" — declare data collection practices
      (mobile number, optional name, and user-submitted grievance photos —
      matching the Android Data Safety answer above)
- [ ] Privacy Policy URL (same as Android)
- [ ] TestFlight internal build for review before public submission

## Both platforms

- [ ] Real app icon and splash screen assets (`assets/icon.png`,
      `assets/adaptive-icon.png`, `assets/splash.png`) — placeholders only
      exist as a brand-color background today; replace via the Branding
      settings in the admin portal design, then re-export static assets for
      the store binary (in-app dynamic branding from `/app-settings` covers
      everything except the OS-level icon/splash, which must ship in the
      binary)
- [ ] Version/build number bump process — recommend EAS's auto-increment
      (`"autoIncrement": true` in `eas.json`) so App Store/Play uploads
      never collide
- [ ] Final production smoke test against the production API URL (not
      localhost) before submitting
