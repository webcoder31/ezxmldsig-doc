---
layout: default
title: Glossary
description: "The terms of the tokens and of the seals, in plain words, each with the page that tells more."
---
<article class="prose" markdown="1">

# Glossary

{: .lead}
The terms these pages and the READMEs of both libraries use, in alphabetical order, each in a few plain words and with the page that tells more. The seals are an experimental feature of the PHP library from 2.1.0 and of the Node.js library from 2.0.0; the rest applies to every version these pages describe.

<div class="see-also" markdown="1">
[A](#aes-gcm) · [B](#base64) · [C](#canonicalization-c14n) · [D](#detached-signature) · [E](#ecdsa) · [I](#identity-provider-idp) · [L](#level-b) · [O](#ocsp) · [P](#pem) · [R](#replay) · [S](#seal) · [T](#time-to-live) · [V](#validation-data) · [X](#x509-certificate)
</div>

### AES-GCM

The cipher that encrypts the data of a token by default (AES-256-GCM). It checks an authentication tag before returning anything: altered data are refused as a whole. AES-CBC and Triple DES, which have no such tag, are read only when the receiver names them. See [Encryption]({{ '/encryption/' | relative_url }}).

### ASiC-E

The container of a seal (ETSI EN 319 162-1): a ZIP archive, `.asice`, that holds the sealed files, a manifest listing them (`META-INF/manifest.xml`) and the XAdES signature over them (`META-INF/signatures001.xml`). Any ZIP tool opens it; a validator of electronic signatures checks it.

### Audience

Who a token is addressed to: application names, URLs, any value the issuer and the receivers agree on (`TokenAudience`). A receiver gives its own with `expectedAudience`, and refuses a token addressed to someone else, so that a token issued for one application does not open another. See [The receiver's duties]({{ '/receiver/#audience' | relative_url }}).

### Base64

A way to write any bytes with 64 printable characters. The values of the data of a token, the certificate it carries and its signature are written in Base64: `UmFnbmFyIExvdGhicm9r` is `Ragnar Lothbrok`. It hides nothing: anyone can decode it.

### Canonicalization (C14N)

The rewriting of XML into a single form (attribute order, namespaces, line ends…) before its digest is computed, so that two writings of the same XML give the same digest. A token uses inclusive canonicalization by default, a seal exclusive canonicalization.

### Certificate revocation list (CRL)

A list, signed by a certification authority and published at an address its certificates name, of the certificates it revoked before their expiry. The verification of a seal reads the CRLs it is given; the analysis of a token reads none. See [Revocation](#revocation).

### Certification authority (CA)

Who issues certificates: it signs, with its private key, the certificate of a holder, and so vouches that its public key is the holder's. A **root** CA signs its own certificate; an **intermediate** CA has its certificate signed by the root, and issues the certificates of the end users. See [Why?]({{ '/why/' | relative_url }}).

### Chain of trust

The certificates that link a signing certificate to a root CA, each signed by the next one: signing certificate, intermediate CA, root. A receiver trusts a signing certificate only if its chain reaches a CA it chose to trust. See [Why?]({{ '/why/#the-chain-of-trust' | relative_url }}).

### Detached signature

A signature kept beside what it signs, rather than around it: the XAdES signature of a seal signs the files of its container without holding them. A token is the opposite, an enveloping signature: its signature holds its own data.

### Digest

A short fingerprint of data (SHA-256 by default), which changes entirely when a single character of the data changes. A token signs the digest of its node `Token`; a seal signs the digests of its files. See [How does it work?]({{ '/how-it-works/' | relative_url }}).

### Digital signature

The value computed from data with a private key, which the matching public key verifies: it proves that the data have not changed since they were signed. Who signed them is told by the trust in the certificate of the key, not by the signature alone. See [How does it work?]({{ '/how-it-works/' | relative_url }}).

### Distinguished name (DN)

The name of a certificate holder (its subject) or of its issuer, made of fields: country `C`, organization `O`, department `OU`, common name `CN`… A receiver can require a given subject with `expectedSubject`. See [Certificates and keys]({{ '/certificates/#the-fields-of-the-subject' | relative_url }}).

### `ds:Object`

The element of a token that holds its node `Token`: the data, the timestamp, the identifier, and the expiry and audience if any. Its digest is written in `ds:SignedInfo`. See [How does it work?]({{ '/how-it-works/#what-a-token-looks-like' | relative_url }}).

### `ds:SignedInfo`

The element of a token that the private key of the sender signs: it names the algorithms, and holds the digest of `ds:Object`. Signing it seals the data, since it holds their digest. See [How does it work?]({{ '/how-it-works/#what-a-token-looks-like' | relative_url }}).

### DSS

Digital Signature Service, the validator of electronic signatures of the European Commission, free and open source. It validates the seals of both libraries, and the tests of each library have their seals validated by it, at levels B, T and LT.

### ECDSA

A signature algorithm over elliptic curves (P-256, P-384, P-521), with shorter keys than RSA for the same strength. A seal can be signed with an EC key; a token cannot: its keys are RSA keys.

### Encryption certificate

The certificate of the receiver of an encrypted token, whose public key encrypts the session key. The sender needs this certificate, never the private key of the receiver. See [Encryption]({{ '/encryption/' | relative_url }}).

### EU trusted lists

The lists, published by each member state of the European Union, of the trust service providers it supervises and of their certificates. DSS relies on them to tell a qualified electronic signature or seal; the seals of the tests, issued by a test CA, are not qualified, and DSS trusts that CA because it is configured to.

### Expiry

The date after which a token is out of date, written in it by its issuer with the option `validity` (`TokenExpiry`). The receiver refuses a token past it, whatever its own time to live. See [The receiver's duties]({{ '/receiver/#freshness-and-expiry' | relative_url }}).

### Identity provider (IdP)

In a single sign-on, the site that knows the users and their passwords, and signs a token for each application the user enters. The applications trust its certificate and know no password. See [Single sign-on]({{ '/single-sign-on/' | relative_url }}).

### Level B

The basic level of a XAdES signature (EN 319 132-1): the signature, the signing certificate and the time the signer claims. That time proves nothing: the certificate is checked at the current date, and must not be revoked.

### Level LT

Level T, plus the validation data that prove the certificates were valid at the time of the time-stamp: the certificates of the chains, and CRLs or OCSP responses issued after it. A seal of level LT can be validated later without reaching the certification authorities, as long as the certificate of the time-stamping authority is valid. A later level, LTA, which the libraries do not make, time-stamps all of this again.

### Level T

Level B, plus a time-stamp of the signature by a time-stamping authority: it proves the seal existed at that time, and the certificate of the signer is then checked at that time rather than at the current date.

### OCSP

Online Certificate Status Protocol (RFC 6960): a service, named in a certificate, that answers whether that certificate is revoked, in a response signed by its CA or by a responder the CA delegated. The verification of a seal reads the responses it is given; the libraries send no request themselves. See [Revocation](#revocation).

### PEM

A text form of a certificate or of a key: its bytes in Base64, between `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----` lines. The libraries read certificates and keys in this form.

### Private key

The half of a key pair that its holder alone knows: it signs, or decrypts. Whoever holds it can sign in the holder's name: see [When a key is compromised]({{ '/certificates/#when-a-key-is-compromised' | relative_url }}).

### Public key

The half of a key pair that anyone may hold: it verifies what the private key signs, or encrypts for it. It travels in a certificate. See [How does it work?]({{ '/how-it-works/#two-linked-keys' | relative_url }}).

### Replay

Submitting again a token that was accepted once, by whoever intercepted it. The libraries keep no list of the tokens they analyzed: the receiver stores the identifier of each token it accepts and refuses it the second time. See [The receiver's duties]({{ '/receiver/#replay' | relative_url }}).

### Revocation

The withdrawal of a certificate by its CA before its expiry, when its key leaked or its holder changed, told by a CRL or an OCSP responder. The verification of a seal checks it, from the CRLs and OCSP responses it is given or that the seal embeds. The analysis of a token does not: see [When a key is compromised]({{ '/certificates/#when-a-key-is-compromised' | relative_url }}).

### RSA-OAEP

The algorithm that encrypts the session key of a token for its receiver (key transport). RSA 1.5, its predecessor, is refused, since how its padding fails can betray the key (Bleichenbacher's attack). See [Encryption]({{ '/encryption/' | relative_url }}).

### RSA-PSS

The RSA signature scheme a seal uses by default, with a random salt. PKCS#1 v1.5, the older scheme that tokens use, remains accepted for seals.

### Seal

Files sealed together: an ASiC-E container that holds them and a detached XAdES signature over them, at level B, T or LT. It proves who sealed the files, and that they have not changed since. Any file can be sealed: contracts, PDF, text. See the section "Seals" of the README, [in PHP](https://github.com/webcoder31/ezxmldsig-php#seals-experimental) · [in Node.js](https://github.com/webcoder31/ezxmldsig-js#seals-experimental).

### Session key

A key drawn at random for one encrypted token, which encrypts its data; it is itself encrypted for the receiver with RSA-OAEP. See [Encryption]({{ '/encryption/' | relative_url }}).

### Signature wrapping

An attack that places a forged node beside the signed one, so that a receiver checks the signature of the one and reads the other. The libraries refuse documents built this way, and read the data only from the node the signature covers. See [How does it work?]({{ '/how-it-works/#signature-wrapping' | relative_url }}).

### Signing certificate

The certificate whose private key signs a token or a seal; a token carries it in `ds:KeyInfo`, a seal in its signature. The receiver trusts it through its chain (`caCertPath`), or pins it (`signerCertPath`). See [Certificates and keys]({{ '/certificates/' | relative_url }}).

### Single sign-on (SSO)

One login on an identity provider that opens every application trusting it: the identity provider signs a token for each application, which checks it before opening a session of its own. See [Single sign-on]({{ '/single-sign-on/' | relative_url }}).

### Time to live

How long a receiver accepts a token after the date it was signed (`TokenTimestamp`), its freshness: `isOutOfDate(ttl)` tells it, with 30 seconds of tolerance for clocks out of step. Choose it short. See [The receiver's duties]({{ '/receiver/#freshness-and-expiry' | relative_url }}).

### Time-stamp

A token of a time-stamping authority (RFC 3161) that proves some data existed at a given time: it signs their digest with that time. A seal of level T holds a time-stamp of its signature.

### Time-stamping authority (TSA)

A trusted third party that issues time-stamps. The libraries give the request to send it, and check its response; they send nothing themselves. The verification of a seal of level T trusts the authority through `tsaCertPath`.

### Token

The XML document the libraries create and verify: an XML digital signature that envelops its own data, with their timestamp, a random identifier and, as options, an expiry and an audience; its data may be encrypted for its receiver. See [How does it work?]({{ '/how-it-works/' | relative_url }}).

### Token identifier

The 128 random bits of a token, in 32 lowercase hexadecimal characters (`TokenId`), covered by its signature: the receiver stores it to refuse a replay. See [The receiver's duties]({{ '/receiver/#replay' | relative_url }}).

### Trust anchor

What a receiver chooses to trust, from which the rest follows: the CA certificates of `caCertPath`, or the very signing certificate of `signerCertPath`, narrowed if need be to a subject with `expectedSubject`. See the section "Trust anchor" of the README, [in PHP](https://github.com/webcoder31/ezxmldsig-php#trust-anchor) · [in Node.js](https://github.com/webcoder31/ezxmldsig-js#trust-anchor).

### Validation data

The certificates, CRLs and OCSP responses that prove the certificates of a seal were valid and not revoked. A seal of level LT embeds them; the libraries list those to fetch (`validationDataRequests()`) and fetch nothing themselves.

### X.509 certificate

The identity card of a public key: it says "this public key belongs to this holder", for a period, signed by a certification authority. See [How does it work?]({{ '/how-it-works/#two-linked-keys' | relative_url }}).

### XAdES

XML Advanced Electronic Signatures (ETSI EN 319 132-1): an XML signature with the properties that electronic signature law expects (the signing certificate, the signing time, then time-stamps and validation data), at levels B, T, LT and LTA. The signature of a seal is a detached XAdES signature.

### XML Encryption

The W3C standard of encrypted XML: the data are replaced by an `xenc:EncryptedData` element, whose key is encrypted for the receiver. Encrypted tokens follow it. See [Encryption]({{ '/encryption/' | relative_url }}).

### XML Signature (XMLDSig)

The W3C standard of signed XML: `ds:Signature`, its `ds:SignedInfo`, its `ds:SignatureValue` and its `ds:KeyInfo`. Tokens follow it, and so does the XAdES signature of a seal. See [How does it work?]({{ '/how-it-works/' | relative_url }}).

### xml-crypto, xml-encryption

Two libraries for Node.js, of XML Signature and of XML Encryption. They create and read the tokens of ezxmldsig, both ways, but only verify a signature and decrypt: a receiver that uses them makes the other checks itself. See [Interoperability]({{ '/interoperability/' | relative_url }}).

</article>
