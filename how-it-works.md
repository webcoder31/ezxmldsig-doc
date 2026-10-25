---
layout: default
title: How does it work?
description: "How a token is signed, what it holds, and the three questions its receiver answers before trusting it."
---
<article class="prose" markdown="1">

# How does it work?

{: .lead}
A token works like a letter in an envelope sealed with wax and the seal of an authority: anyone may read the letter (unless it is encrypted), nobody can change it without breaking the seal, and a fake seal, however well made, does not fool a receiver who knows the real one.

## Two linked keys

The sender owns an RSA key pair: a **private key**, known to it alone, which signs, and a **public key**, which anyone may hold, which verifies. What the private key signs, the public key verifies; but the public key cannot sign. To produce a valid signature, one must hold the private key.

The public key travels in an **X.509 certificate**, a kind of identity card that says "this public key belongs to this sender", itself signed by a certification authority (CA): see [Why?]({{ '/why/' | relative_url }}) for the chain of trust.

## What a token looks like

A token is an XML digital signature that envelops its own data. Below, a token signed by the demo, indented, its long Base64 values shortened to their first and last 8 characters. The user data are Base64 encoded: `UmFnbmFyIExvdGhicm9r` is `Ragnar Lothbrok`.

```xml
<?xml version="1.0"?>
<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <ds:SignedInfo>
    <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
    <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
    <ds:Reference URI="#Token">
      <ds:Transforms>
        <ds:Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
      </ds:Transforms>
      <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
      <ds:DigestValue>8TdHTRsJ ... FpKRsBk=</ds:DigestValue>
    </ds:Reference>
  </ds:SignedInfo>
  <ds:SignatureValue>ANXIS2CZ ... CF/GYw==</ds:SignatureValue>
  <ds:KeyInfo>
    <ds:X509Data>
      <ds:X509Certificate>MIIFMTCC ... tV4guQ==</ds:X509Certificate>
    </ds:X509Data>
  </ds:KeyInfo>
  <ds:Object Id="Token">
    <Token>
      <TokenTimestamp>2026-10-17T06:58:55Z</TokenTimestamp>
      <TokenId>9e0325fac353152dd7c241a719da0f72</TokenId>
      <TokenData>
        <name Algorithm="base64">UmFnbmFyIExvdGhicm9r</name>
        <role Algorithm="base64">SmFybA==</role>
        <location Algorithm="base64">S2F0dGVnYXQ=</location>
      </TokenData>
    </Token>
  </ds:Object>
</ds:Signature>
```

* `ds:Object` holds the node `Token`: the data, their timestamp and the identifier of the token.
* `ds:SignedInfo` names the algorithms and holds the digest of `Token` (`ds:DigestValue`).
* `ds:SignatureValue` is the signature of `ds:SignedInfo`.
* `ds:KeyInfo` carries the certificate of the sender.

## Creating a token

1. The user data are written in the node `Token`, with a timestamp, a random identifier and, as options, an expiry and the receivers the token is addressed to (its audience).
2. A **digest** (SHA-256 by default) of this node is computed: it changes entirely if a single character of the node changes. It is written in `ds:SignedInfo` (`ds:DigestValue`).
3. The sender **signs `ds:SignedInfo`** with its private key, and writes the result in `ds:SignatureValue`. Since `ds:SignedInfo` holds the digest of the data, signing the one seals the other.
4. The **certificate** of the sender is added to the token (`ds:KeyInfo`), so that the receiver knows which public key to verify with.

When the data are encrypted (see [Encryption]({{ '/encryption/' | relative_url }})), they are encrypted before being signed: the signature covers the encrypted data. Encryption protects their confidentiality; the authenticity of the token rests on the signature alone.

## Verifying a token: three questions

1. **Were the data changed?** The receiver computes the digest of the data again and compares it with `ds:DigestValue`. If they differ, someone changed the content.
2. **Is the seal intact?** With the public key of the certificate the token carries, the receiver verifies that `ds:SignatureValue` matches `ds:SignedInfo`. Whoever changes the digest to match altered data breaks the signature.
3. **Who sealed it?** This is the question that decides. An attacker can alter the data, then **sign everything again with a key of their own** and add **their own certificate**: questions 1 and 2 then pass, the digest and the signature being mathematically correct. But the seal is not the one of the sender. The receiver must therefore check that the certificate of the token is trusted: issued by a CA it chose to trust (`caCertPath`), or the very certificate it expects (`signerCertPath`), and, when it asks for it, with the subject it expects (`expectedSubject`). The certificate of the attacker meets none of these conditions: the token is rejected.

**A valid signature proves nothing until one knows who made it**: the authenticity of a token is its signature, plus the trust in the key that made it.

<div class="see-also" markdown="1">
Declaring the trusted certificates: the section "Trust anchor" of the README, [in PHP](https://github.com/webcoder31/ezxmldsig-php#trust-anchor) · [in Node.js](https://github.com/webcoder31/ezxmldsig-js#trust-anchor).
</div>

## What else is checked

An authentic token can still be misused. The receiver also checks:

* the **algorithms**: only those it expects, not a weak one chosen by an attacker;
* the **audience**: the token is addressed to this receiver; a token signed for one application must not open another;
* the **freshness** and the **expiry**: a token too old is rejected;
* the **replay**: the identifier of each token accepted is stored, and a token already accepted is rejected.

The first two are made by `isSignatureValid()`; freshness, expiry and replay are up to the receiver (see [The receiver's duties]({{ '/receiver/' | relative_url }})).

## Signature wrapping

The data must be read **only from the node the signature covers**, never from elsewhere in the document: otherwise, a forged `Token` placed beside the signed one would be read. The libraries reject documents built this way, and `getData()` reads the node the digest was computed on.

## In short

| Question | Mechanism | What it prevents |
|---|---|---|
| Are the data intact? | Digest of the node `Token` | Altering the data |
| Is the seal intact? | Signature of `ds:SignedInfo` | Altering the digest |
| Is it the expected sender? | Trust in the certificate (CA, pinned certificate, subject) | Signing again with another key |
| Right receiver, right time, first use? | Audience, freshness, expiry, replay | Reusing a genuine token where or when it should not be |

The [token lab](https://ezxmldsig.wbcdr.dev) plays these checks out on real tokens, and replays the attacks the libraries reject.

</article>
