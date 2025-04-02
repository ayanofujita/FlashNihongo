# Deployment Instructions

## Google OAuth Configuration

To ensure that Google OAuth authentication works properly in both development and production environments, follow these steps:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Find your **OAuth 2.0 Client ID** and click on it to edit
5. In the **Authorized JavaScript Origins** section, add:
   - Your Replit development domain (e.g., `https://your-repl-id.riker.replit.dev`)
   - Your Replit production domain (e.g., `https://your-app.replit.app`)
   - Any custom domains you're using
   
6. In the **Authorized Redirect URIs** section, add:
   - `https://your-repl-id.riker.replit.dev/auth/google/callback`
   - `https://your-app.replit.app/auth/google/callback`
   - Any custom domain callback URLs you're using

7. Click **Save**

## Environment Variables

Ensure the following environment variables are set in your Replit Secrets:

- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
- `SESSION_SECRET`: A strong random string to secure your sessions

## Deployment Checklist

Before deploying:

1. Verify that both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correctly set in your Replit Secrets
2. Make sure your Google Cloud Console project has the correct callback URLs configured
3. Check that your application is running properly in development mode
4. Deploy using the Replit deployment system

## Troubleshooting

If authentication still fails after deployment:

1. Check the server logs for any error messages related to OAuth
2. Verify that the callback URL being used matches one of the authorized redirect URIs in Google Cloud Console
3. Make sure your Google Cloud Console project has the Google+ API enabled
4. Confirm that your application can access the environment variables in production

## Browser Considerations

For proper authentication:

1. Ensure cookies are enabled in your browser
2. If using browser privacy tools or extensions, consider allowing cookies from your application's domain
3. Some browsers might block third-party cookies, which can affect OAuth flows
