# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: post-deploy.spec.ts >> Post-deploy: production smoke >> Sentry receives a test error triggered from the production environment
- Location: tests\e2e\post-deploy.spec.ts:83:7

# Error details

```
Error: browserType.launch: Executable doesn't exist at C:\Users\AbinKattady\AppData\Local\ms-playwright\firefox-1538\firefox\firefox.exe
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     npx playwright install                                 ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
```