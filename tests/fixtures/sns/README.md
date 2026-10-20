# Synthetic SNS signature fixtures

This RSA private key and self-signed certificate exist only to test signature verification offline. They were generated for this repository and are not AWS keys, production signing material or deployment credentials. They are intentionally public test fixtures. Tests sign envelopes with the fixture key and substitute certificate HTTP transport; production verification code still uses its real X509/RSA path.
