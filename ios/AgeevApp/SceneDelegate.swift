import UIKit
import React
import React_RCTAppDelegate

// UIScene-жизненный цикл: SDK iOS 27 требует его, иначе приложение падает на
// старте (SIGTRAP в UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption).
// RN 0.85 сцен ещё не знает (появилось в 0.88), поэтому окно и запуск RN живут
// здесь, а AppDelegate только готовит фабрику. Одна сцена, без мультиокон.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory
    else { return }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    // Часть нативных модулей берёт окно у AppDelegate.
    appDelegate.window = window

    // Холодный старт по ссылке: со сценами URL приходит не в launchOptions, а в
    // connectionOptions. Прокидываем его в launchOptions под теми же ключами,
    // которые читает Linking.getInitialURL (RCTLinkingManager).
    var launchOptions = appDelegate.launchOptions ?? [:]
    if let url = connectionOptions.urlContexts.first?.url {
      launchOptions[.url] = url
    }
    if let activity = connectionOptions.userActivities.first(where: {
      $0.activityType == NSUserActivityTypeBrowsingWeb
    }) {
      launchOptions[.userActivityDictionary] = [
        UIApplication.LaunchOptionsKey.userActivityType.rawValue: activity.activityType,
        "UIApplicationLaunchOptionsUserActivityKey": activity,
      ]
    }

    factory.startReactNative(
      withModuleName: "AgeevApp",
      in: window,
      launchOptions: launchOptions
    )
    window.makeKeyAndVisible()
  }

  // ageev://… пока приложение запущено.
  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let context = URLContexts.first else { return }
    var options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    if let source = context.options.sourceApplication {
      options[.sourceApplication] = source
    }
    if let annotation = context.options.annotation {
      options[.annotation] = annotation
    }
    _ = RCTLinkingManager.application(UIApplication.shared, open: context.url, options: options)
  }

  // Universal links (https://app.agvclub.ru/l/…) → JS.
  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    _ = RCTLinkingManager.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
  }
}
