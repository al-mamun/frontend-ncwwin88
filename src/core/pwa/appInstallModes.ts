/**
 * appInstallModes — read a tenant's chosen app-install presentation(s), with the
 * default applied. Values are any combination of 'button' | 'banner' | 'popup'.
 *
 * Default is ['button'] (a persistent button/link, rendered by the theme via
 * useGetApp()). Banner + popup are rendered by <AppInstall/>. All presentations
 * call useGetApp() so the underlying action (APK link / PWA install / iOS hint)
 * is identical.
 */
export function appInstallModes(t: { appInstallModes?: string[] }): string[] {
  return t.appInstallModes && t.appInstallModes.length ? t.appInstallModes : ['button'];
}
