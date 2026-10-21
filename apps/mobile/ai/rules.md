# Mobile app rules

Read the [shared app rules](../../../ai/resources/app_common_rules.md) and the repository [AI rules](../../../ai/ai_agent_root_rules.md).

- Use Expo and the existing React Native conventions when the mobile app is implemented.
- Test supported flows in Expo Go or the configured device workflow before claiming mobile verification.
- Treat background location, notifications, offline data, and secure storage as consented, privacy-sensitive features.
- Keep EAS configuration and device-specific behavior explicit; do not imply web-browser verification covers native behavior.
- Record mobile-only work in [mobile progress](../docs/progress.md).