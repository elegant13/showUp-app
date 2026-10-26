import Foundation
import Capacitor
import GoogleSignIn

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitor.ionicframework.com/docs/plugins/ios
 */
@objc(GoogleAuth)
public class GoogleAuth: CAPPlugin {
    var signInCall: CAPPluginCall!
    var googleSignIn: GIDSignIn!;
    var googleSignInConfiguration: GIDConfiguration!;
    var forceAuthCode: Bool = false;
    var additionalScopes: [String]!;

    func loadSignInClient (
        customClientId: String,
        customScopes: [String]
    ) {
        googleSignIn = GIDSignIn.sharedInstance;
        
        forceAuthCode = getConfig().getBoolean("forceCodeForRefreshToken", false)

        if forceAuthCode, let serverClientId = getServerClientIdValue() {
            googleSignInConfiguration = GIDConfiguration.init(clientID: customClientId, serverClientID: serverClientId)
        } else {
            googleSignInConfiguration = GIDConfiguration.init(clientID: customClientId)
        }
        
        // these are scopes granted by default by the signIn method
        let defaultGrantedScopes = ["email", "profile", "openid"];
        // these are scopes we will need to request after sign in
        additionalScopes = customScopes.filter {
            return !defaultGrantedScopes.contains($0);
        };

        NotificationCenter.default.addObserver(self, selector: #selector(handleOpenUrl(_ :)), name: Notification.Name(Notification.Name.capacitorOpenURL.rawValue), object: nil);
    }

    
    public override func load() {
        super.load()
        if let clientId = getClientIdValue() {
            let customScopes = (getConfig().getArray("scopes") as? [String]) ?? ["email", "profile"]
            self.loadSignInClient(customClientId: clientId, customScopes: customScopes)
        }
    }

    @objc
    func initialize(_ call: CAPPluginCall) {
        // get client id from initialize, with client id from config file as fallback
        guard let clientId = call.getString("clientId") ?? getClientIdValue() as? String else {
            NSLog("no client id found in config");
            call.resolve();
            return;
        }

        // get scopes from initialize, with scopes from config file as fallback
        let customScopes = call.getArray("scopes", String.self) ?? (
            (getConfig().getArray("scopes") as? [String]) ?? ["email", "profile"]
        );

        // get force auth code from initialize, with config from config file as fallback
        forceAuthCode = call.getBool("grantOfflineAccess") ?? (
            getConfig().getBoolean("forceCodeForRefreshToken", false)
        );
        
        // load client
        self.loadSignInClient(
            customClientId: clientId,
            customScopes: customScopes
        )
        call.resolve();
    }

    @objc
    func signIn(_ call: CAPPluginCall) {
        signInCall = call;
        if self.googleSignIn == nil {
            guard let clientId = getClientIdValue() else {
                call.reject("no client id found in config");
                return;
            }
            let customScopes = (getConfig().getArray("scopes") as? [String]) ?? ["email", "profile"];
            self.loadSignInClient(customClientId: clientId, customScopes: customScopes);
        }
        guard let googleSignIn = self.googleSignIn, let config = self.googleSignInConfiguration else {
            call.reject("Google Sign-In is not initialized");
            return;
        }
        DispatchQueue.main.async {
            let startInteractiveSignIn = {
                guard let presentingVc = self.bridge?.viewController else {
                    self.signInCall?.reject("No presenting view controller");
                    return;
                }
                
                NSLog("[GoogleAuth] Starting interactive Google Sign-In with clientID: %@", config.clientID);
                googleSignIn.signIn(with: config, presenting: presentingVc, hint: nil, additionalScopes: self.additionalScopes ?? []) { user, error in
                    if let error = error {
                        let nsErr = error as NSError
                        NSLog("[GoogleAuth] Native signIn failed: code=%ld, domain=%@, desc=%@", nsErr.code, nsErr.domain, error.localizedDescription);
                        self.signInCall?.reject(error.localizedDescription, "\(nsErr.code)");
                        return;
                    }
                    guard let user = user else {
                        self.signInCall?.reject("User not found");
                        return;
                    }
                    self.resolveSignInCallWith(user: user);
                };
            }

            if googleSignIn.hasPreviousSignIn() && !self.forceAuthCode {
                googleSignIn.restorePreviousSignIn() { user, error in
                    if let user = user {
                        self.resolveSignInCallWith(user: user);
                        return;
                    }
                    NSLog("[GoogleAuth] restorePreviousSignIn did not resolve user (%@), falling back to interactive sign-in", error?.localizedDescription ?? "nil");
                    startInteractiveSignIn();
                }
            } else {
                startInteractiveSignIn();
            }
        }
    }

    @objc
    func refresh(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let googleSignIn = self.googleSignIn else {
                call.reject("Google Sign-In is not initialized");
                return;
            }
            if googleSignIn.currentUser == nil {
                call.reject("User not logged in.");
                return
            }
            googleSignIn.currentUser!.authentication.do { (authentication, error) in
                guard let authentication = authentication else {
                    call.reject(error?.localizedDescription ?? "Something went wrong.");
                    return;
                }
                let authenticationData: [String: Any] = [
                    "accessToken": authentication.accessToken,
                    "idToken": authentication.idToken ?? NSNull(),
                    "refreshToken": authentication.refreshToken
                ]
                call.resolve(authenticationData);
            }
        }
    }

    @objc
    func signOut(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.googleSignIn?.signOut();
        }
        call.resolve();
    }

    @objc
    func handleOpenUrl(_ notification: Notification) {
        guard let object = notification.object as? [String: Any] else {
            print("There is no object on handleOpenUrl");
            return;
        }
        guard let url = object["url"] as? URL else {
            print("There is no url on handleOpenUrl");
            return;
        }
        self.googleSignIn?.handle(url);
    }
    
    
    func getClientIdValue() -> String? {
        if let clientId = getConfig().getString("iosClientId") {
            return clientId;
        }
        else if let clientId = getConfig().getString("clientId") {
            return clientId;
        }
        else if let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
                let dict = NSDictionary(contentsOfFile: path) as? [String: AnyObject],
                let clientId = dict["CLIENT_ID"] as? String {
            return clientId;
        }
        return "115199141886-99m5rosha76ftskaeknj2e757mn0sb0t.apps.googleusercontent.com";
    }
    
    func getServerClientIdValue() -> String? {
        if let serverClientId = getConfig().getString("serverClientId"), !serverClientId.isEmpty {
            return serverClientId;
        }
        return nil;
    }

    func resolveSignInCallWith(user: GIDGoogleUser) {
        var userData: [String: Any] = [
            "authentication": [
                "accessToken": user.authentication.accessToken,
                "idToken": user.authentication.idToken,
                "refreshToken": user.authentication.refreshToken
            ],
            "serverAuthCode": user.serverAuthCode ?? NSNull(),
            "email": user.profile?.email ?? NSNull(),
            "familyName": user.profile?.familyName ?? NSNull(),
            "givenName": user.profile?.givenName ?? NSNull(),
            "id": user.userID ?? NSNull(),
            "name": user.profile?.name ?? NSNull()
        ];
        if let imageUrl = user.profile?.imageURL(withDimension: 100)?.absoluteString {
            userData["imageUrl"] = imageUrl;
        }
        signInCall?.resolve(userData);
    }
}
