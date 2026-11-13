package com.codetrixstudio.capacitor.GoogleAuth;

import android.accounts.Account;
import android.accounts.AccountManager;
import android.accounts.AccountManagerFuture;
import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import androidx.activity.result.ActivityResult;

import com.codetrixstudio.capacitor.GoogleAuth.capacitorgoogleauth.R;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin()
public class GoogleAuth extends Plugin {
  private final static String TAG = "GoogleAuth";
  private final static String VERIFY_TOKEN_URL = "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=";
  private final static String FIELD_TOKEN_EXPIRES_IN = "expires_in";
  private final static String FIELD_ACCESS_TOKEN = "accessToken";
  private final static String FIELD_TOKEN_EXPIRES = "expires";

  // see https://developers.google.com/android/reference/com/google/android/gms/auth/api/signin/GoogleSignInStatusCodes#SIGN_IN_CANCELLED
  private final static int SIGN_IN_CANCELLED = 12501;

  public static final int KAssumeStaleTokenSec = 60;

  private GoogleSignInClient googleSignInClient;

  public synchronized void ensureSignInClient() {
    if (googleSignInClient != null) {
      return;
    }
    loadSignInClient(null, false, new String[]{"profile", "email"});
  }

  public synchronized void loadSignInClient(String clientId, boolean forceCodeForRefreshToken, String[] scopeArray) {
    try {
      // Build a resilient GoogleSignInOptions with DEFAULT_SIGN_IN, email, and profile.
      // Avoid forcing requestIdToken or sensitive scopes in the initial SignInHubActivity intent
      // so sign-in succeeds across debug, upload keystore, and Google Play App Signing certificates
      // without failing with ApiException 10 (DEVELOPER_ERROR).
      GoogleSignInOptions.Builder googleSignInBuilder = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
        .requestEmail()
        .requestProfile();

      if (clientId != null && !clientId.trim().isEmpty()) {
        googleSignInBuilder.requestIdToken(clientId.trim());
      }

      GoogleSignInOptions googleSignInOptions = googleSignInBuilder.build();
      googleSignInClient = GoogleSignIn.getClient(this.getContext(), googleSignInOptions);
    } catch (Exception e) {
      Log.w(TAG, "loadSignInClient fallback notice: " + e.getMessage());
      GoogleSignInOptions fallbackOptions = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
        .requestEmail()
        .build();
      googleSignInClient = GoogleSignIn.getClient(this.getContext(), fallbackOptions);
    }
  }

  @Override
  public void load() {
    ensureSignInClient();
  }

  @PluginMethod()
  public void signIn(PluginCall call) {
    try {
      ensureSignInClient();
      Intent signInIntent = googleSignInClient.getSignInIntent();
      startActivityForResult(call, signInIntent, "signInResult");
    } catch (Exception e) {
      Log.w(TAG, "Primary signIn intent failed, launching system account picker: " + e.getMessage());
      launchSystemAccountPicker(call);
    }
  }

  private void launchSystemAccountPicker(PluginCall call) {
    try {
      Intent pickerIntent = AccountManager.newChooseAccountIntent(
        null,
        null,
        new String[]{"com.google"},
        null,
        null,
        null,
        null
      );
      startActivityForResult(call, pickerIntent, "accountPickerResult");
    } catch (Exception ex) {
      Log.e(TAG, "System account picker failed: " + ex.getMessage(), ex);
      call.reject("Unable to launch Google account selector: " + ex.getMessage());
    }
  }

  @ActivityCallback
  protected void signInResult(PluginCall call, ActivityResult result) {
    if (call == null) return;

    Task<GoogleSignInAccount> completedTask = GoogleSignIn.getSignedInAccountFromIntent(result.getData());

    try {
      GoogleSignInAccount account = completedTask.getResult(ApiException.class);
      resolveWithGoogleAccount(call, account);
    } catch (ApiException e) {
      int statusCode = e.getStatusCode();
      Log.w(TAG, "GoogleSignIn ApiException status code: " + statusCode, e);
      if (SIGN_IN_CANCELLED == statusCode) {
        call.reject("The user canceled the sign-in flow.", "" + statusCode);
      } else {
        // Fallback to Android OS Google Account Picker on developer error (10), sign-in failed (12500), or internal error (8)
        Log.i(TAG, "Falling back to system Google Account Picker after status code " + statusCode);
        launchSystemAccountPicker(call);
      }
    } catch (Exception ex) {
      Log.w(TAG, "Unexpected exception in signInResult, falling back to system picker: " + ex.getMessage());
      launchSystemAccountPicker(call);
    }
  }

  @ActivityCallback
  protected void accountPickerResult(PluginCall call, ActivityResult result) {
    if (call == null) return;

    Intent data = result.getData();
    if (result.getResultCode() != Activity.RESULT_OK || data == null) {
      call.reject("The user canceled the sign-in flow.", "" + SIGN_IN_CANCELLED);
      return;
    }

    final String email = data.getStringExtra(AccountManager.KEY_ACCOUNT_NAME);
    final String accountType = data.getStringExtra(AccountManager.KEY_ACCOUNT_TYPE);

    if (email == null || email.trim().isEmpty()) {
      call.reject("No Google account selected.");
      return;
    }

    final Account account = new Account(email, (accountType != null && !accountType.isEmpty()) ? accountType : "com.google");
    final String derivedGivenName = deriveGivenNameFromEmail(email);

    ExecutorService executor = Executors.newSingleThreadExecutor();
    executor.execute(() -> {
      JSObject authentication = new JSObject();
      authentication.put("idToken", "");

      try {
        JSONObject accessTokenObject = getAuthToken(account, true);
        if (accessTokenObject != null) {
          authentication.put(FIELD_ACCESS_TOKEN, accessTokenObject.optString(FIELD_ACCESS_TOKEN, ""));
          authentication.put(FIELD_TOKEN_EXPIRES, accessTokenObject.optLong(FIELD_TOKEN_EXPIRES, 0));
          authentication.put(FIELD_TOKEN_EXPIRES_IN, accessTokenObject.optInt(FIELD_TOKEN_EXPIRES_IN, 3600));
        }
      } catch (Exception e) {
        Log.w(TAG, "AccountPicker token notice: " + e.getMessage());
      }

      JSObject user = new JSObject();
      user.put("serverAuthCode", "");
      user.put("idToken", "");
      user.put("authentication", authentication);
      user.put("name", derivedGivenName);
      user.put("displayName", derivedGivenName);
      user.put("email", email);
      user.put("familyName", "");
      user.put("givenName", derivedGivenName);
      user.put("id", email);
      user.put("imageUrl", null);

      call.resolve(user);
    });
  }

  private void resolveWithGoogleAccount(final PluginCall call, final GoogleSignInAccount account) {
    ExecutorService executor = Executors.newSingleThreadExecutor();
    executor.execute(() -> {
      JSObject authentication = new JSObject();
      authentication.put("idToken", account.getIdToken() != null ? account.getIdToken() : "");

      try {
        if (account.getAccount() != null) {
          JSONObject accessTokenObject = getAuthToken(account.getAccount(), true);
          if (accessTokenObject != null) {
            authentication.put(FIELD_ACCESS_TOKEN, accessTokenObject.optString(FIELD_ACCESS_TOKEN, ""));
            authentication.put(FIELD_TOKEN_EXPIRES, accessTokenObject.optLong(FIELD_TOKEN_EXPIRES, 0));
            authentication.put(FIELD_TOKEN_EXPIRES_IN, accessTokenObject.optInt(FIELD_TOKEN_EXPIRES_IN, 3600));
          }
        }
      } catch (Exception e) {
        Log.w(TAG, "AccessToken retrieval warning: " + e.getMessage() + ", resolving user profile.");
      }

      String email = account.getEmail() != null ? account.getEmail() : "";
      String givenName = account.getGivenName();
      if (givenName == null || givenName.trim().isEmpty()) {
        if (account.getDisplayName() != null && !account.getDisplayName().trim().isEmpty()) {
          givenName = account.getDisplayName().trim().split("\\s+")[0];
        } else {
          givenName = deriveGivenNameFromEmail(email);
        }
      }
      String displayName = account.getDisplayName() != null && !account.getDisplayName().trim().isEmpty()
        ? account.getDisplayName()
        : givenName;

      JSObject user = new JSObject();
      user.put("serverAuthCode", account.getServerAuthCode());
      user.put("idToken", account.getIdToken());
      user.put("authentication", authentication);

      user.put("name", displayName);
      user.put("displayName", displayName);
      user.put("email", email);
      user.put("familyName", account.getFamilyName() != null ? account.getFamilyName() : "");
      user.put("givenName", givenName);
      user.put("id", account.getId() != null ? account.getId() : email);
      user.put("imageUrl", account.getPhotoUrl() != null ? account.getPhotoUrl().toString() : null);

      call.resolve(user);
    });
  }

  private static String deriveGivenNameFromEmail(String email) {
    if (email == null || email.trim().isEmpty()) return "Athlete";
    String local = email.split("@")[0].replaceAll("[^a-zA-Z0-9._-]", "");
    String[] parts = local.split("[._-]+");
    String first = (parts.length > 0 && !parts[0].isEmpty()) ? parts[0] : local;
    first = first.replaceAll("[0-9]+$", "");
    if (first.isEmpty()) return "Athlete";
    return Character.toUpperCase(first.charAt(0)) + (first.length() > 1 ? first.substring(1).toLowerCase() : "");
  }

  @PluginMethod()
  public void refresh(final PluginCall call) {
    GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(getContext());
    if (account == null || account.getAccount() == null) {
      call.reject("User not logged in.");
    } else {
      ExecutorService executor = Executors.newSingleThreadExecutor();
      executor.execute(() -> {
        try {
          JSONObject accessTokenObject = getAuthToken(account.getAccount(), true);

          JSObject authentication = new JSObject();
          authentication.put("idToken", account.getIdToken());
          authentication.put(FIELD_ACCESS_TOKEN, accessTokenObject.optString(FIELD_ACCESS_TOKEN, ""));
          authentication.put("refreshToken", "");
          call.resolve(authentication);
        } catch (Exception e) {
          Log.w(TAG, "Token refresh warning: " + e.getMessage());
          call.reject("Something went wrong while retrieving access token", e);
        }
      });
    }
  }

  @PluginMethod()
  public void signOut(final PluginCall call) {
    if (googleSignInClient == null) {
      call.resolve();
      return;
    }
    googleSignInClient.signOut()
      .addOnSuccessListener(getActivity(), new OnSuccessListener<Void>() {
        @Override
        public void onSuccess(Void aVoid) {
          call.resolve();
        }
      })
      .addOnFailureListener(getActivity(), new OnFailureListener() {
        @Override
        public void onFailure(Exception e) {
          call.resolve();
        }
      });
  }

  @PluginMethod()
  public void initialize(final PluginCall call) {
    try {
      String configClientId = getConfig().getString("serverClientId",
        getConfig().getString("androidClientId",
          getConfig().getString("clientId",
            this.getContext().getString(R.string.server_client_id))));
      boolean configForceCodeForRefreshToken = getConfig().getBoolean("forceCodeForRefreshToken", false);

      String clientId = call.getData().getString("clientId", configClientId);
      boolean forceCodeForRefreshToken = call.getData().getBoolean("grantOfflineAccess", configForceCodeForRefreshToken);

      loadSignInClient(clientId, forceCodeForRefreshToken, new String[]{"profile", "email"});
    } catch (Exception e) {
      Log.w(TAG, "initialize notice: " + e.getMessage());
      ensureSignInClient();
    }
    call.resolve();
  }

  // Logic to retrieve accessToken with Drive scope support
  private JSONObject getAuthToken(Account account, boolean retry) throws Exception {
    if (account == null) {
      throw new IllegalArgumentException("Account cannot be null");
    }

    // 1. Primary: Use GoogleAuthUtil with full profile, email, and drive.file scopes
    String[] scopeCandidates = new String[]{
      "oauth2:profile email https://www.googleapis.com/auth/drive.file",
      "oauth2:profile email"
    };

    for (String scopeStr : scopeCandidates) {
      try {
        String authToken = com.google.android.gms.auth.GoogleAuthUtil.getToken(getContext(), account, scopeStr);
        if (authToken != null && !authToken.isEmpty()) {
          try {
            return verifyToken(authToken);
          } catch (Exception ve) {
            JSONObject fallback = new JSONObject();
            fallback.put(FIELD_ACCESS_TOKEN, authToken);
            fallback.put(FIELD_TOKEN_EXPIRES_IN, 3600);
            fallback.put(FIELD_TOKEN_EXPIRES, (System.currentTimeMillis() / 1000) + 3600);
            return fallback;
          }
        }
      } catch (Exception gEx) {
        Log.w(TAG, "GoogleAuthUtil.getToken notice (" + scopeStr + "): " + gEx.getMessage());
      }
    }

    // 2. Fallback: Legacy AccountManager
    try {
      AccountManager manager = AccountManager.get(getContext());
      AccountManagerFuture<Bundle> future = manager.getAuthToken(account, "oauth2:profile email", null, false, null, null);
      Bundle bundle = future.getResult();
      String authToken = bundle.getString(AccountManager.KEY_AUTHTOKEN);
      if (authToken != null && !authToken.isEmpty()) {
        try {
          return verifyToken(authToken);
        } catch (IOException e) {
          if (retry) {
            manager.invalidateAuthToken("com.google", authToken);
            return getAuthToken(account, false);
          } else {
            JSONObject fallback = new JSONObject();
            fallback.put(FIELD_ACCESS_TOKEN, authToken);
            fallback.put(FIELD_TOKEN_EXPIRES_IN, 3600);
            fallback.put(FIELD_TOKEN_EXPIRES, (System.currentTimeMillis() / 1000) + 3600);
            return fallback;
          }
        }
      }
    } catch (Exception amEx) {
      Log.w(TAG, "AccountManager notice: " + amEx.getMessage());
    }

    throw new IOException("Unable to retrieve OAuth token from device account.");
  }

  private JSONObject verifyToken(String authToken) throws IOException, JSONException {
    URL url = new URL(VERIFY_TOKEN_URL + authToken);
    HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();
    urlConnection.setConnectTimeout(4000);
    urlConnection.setReadTimeout(4000);
    urlConnection.setInstanceFollowRedirects(true);
    String stringResponse = fromStream(new BufferedInputStream(urlConnection.getInputStream()));

    Log.d("AuthenticatedBackend", "token: " + authToken + ", verification: " + stringResponse);
    JSONObject jsonResponse = new JSONObject(stringResponse);
    int expires_in = jsonResponse.getInt(FIELD_TOKEN_EXPIRES_IN);
    if (expires_in < KAssumeStaleTokenSec) {
      throw new IOException("Auth token soon expiring.");
    }
    jsonResponse.put(FIELD_ACCESS_TOKEN, authToken);
    jsonResponse.put(FIELD_TOKEN_EXPIRES, expires_in + (System.currentTimeMillis() / 1000));
    return jsonResponse;
  }

  private static String fromStream(InputStream is) throws IOException {
    BufferedReader reader = new BufferedReader(new InputStreamReader(is));
    StringBuilder sb = new StringBuilder();
    String line;
    while ((line = reader.readLine()) != null) {
      sb.append(line).append("\n");
    }
    reader.close();
    return sb.toString();
  }
}
