import { Linking, AppState, Platform } from 'react-native'; // eslint-disable-line import/no-unresolved, max-len
import SafariView from 'react-native-safari-view';

let appStateTimeout;
let previousLinkingCallback;
let previousAppStateCallback;
let safariCallback;

const cleanup = () => {
  clearTimeout(appStateTimeout);

  if (previousLinkingCallback) {
    Linking.removeEventListener('url', previousLinkingCallback);
    previousLinkingCallback = null;
  }

  if (previousAppStateCallback) {
    AppState.removeEventListener('change', previousAppStateCallback);
    previousAppStateCallback = null;
  }
  if (safariCallback) {
    SafariView.removeEventListener('onDismiss');
    SafariView.dismiss();
    safariCallback = null;
  }
};

const openURL = (url) => {
  // Use SafariView on iOS
  if (Platform.OS === 'ios') {
    return SafariView.show({
      url,
      fromBottom: true,
    });
  }
  // Or Linking.openURL on Android
  return Linking.openURL(url);
};

export const dance = (authUrl) => {
  cleanup();

  return openURL(authUrl)
    .then(() => new Promise((resolve, reject) => {
      const handleUrl = (url) => {
        if (!url || url.indexOf('fail') > -1) {
          reject(url);
        } else {
          resolve(url);
        }
      };

      const linkingCallback = ({ url }) => {
        cleanup();
        handleUrl(url);
      };

      const dismissCallback = () => {
        cleanup();
        reject('dismissed');
      }

      if (Platform.OS === 'ios') {
        SafariView.addEventListener('onDismiss', dismissCallback);
        safariCallback = dismissCallback;
      }

      Linking.addEventListener('url', linkingCallback);
      previousLinkingCallback = linkingCallback;

      const appStateCallback = (state) => {
        // Give time for Linking event to fire.
        appStateTimeout = setTimeout(() => {
          if (state === 'active' && Platform.OS === 'android') {
            cleanup();
            reject('cancelled');
          }
        }, 100);
      };

      AppState.addEventListener('change', appStateCallback);
      previousAppStateCallback = appStateCallback;
    }));
};

export const request = fetch;
