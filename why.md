---
layout: default
title: Why?
description: "What ezxmldsig is for: proving the origin of a token, through a chain of trust, not only its integrity."
---
<article class="prose" markdown="1">

# Why?

{: .lead}
A signature guarantees that the data of a token were not changed. What matters most, though, is to know **who issued the token**: it is only worth the trust one has in its sender.

## The chain of trust

This trust rests on X.509 certificates linked into a chain. A certification authority (CA) owns a root certificate, often valid for some twenty years and kept offline. With it, the CA signs the certificates of intermediate CAs, which in turn sign end certificates: shorter-lived, each dedicated to one use (HTTPS server, signature, encryption…). Each certificate is signed with the private key of its issuer and verified with the public key of this issuer, so that the lineage of any certificate can be traced back to the root.

The intermediate CAs shield the root. If one of them is compromised, it is revoked and replaced without touching the root, which remains the anchor of trust.

## A root of one's own

The root can be the one of a public CA, as for HTTPS certificates. It can also be the one of a company: for an internal single sign-on, the company creates its own root, then an intermediate CA, then the certificate that signs the login tokens of its applications (intranet, CRM, back office…).

## What the libraries check

The receiver declares the CA certificates it trusts, the root and the intermediates, and a token is accepted only if its signing certificate descends from them. The receiver can also require a given subject, or one given certificate.

A token signed with any other certificate is rejected, even though its signature is mathematically correct: that signature proves that the data did not change since it was made, not who made it. [How does it work?]({{ '/how-it-works/' | relative_url }}) goes through the checks one by one.

<div class="see-also" markdown="1">
Declaring the trusted certificates: the section "Trust anchor" of the README, [in PHP](https://github.com/webcoder31/ezxmldsig-php#trust-anchor) · [in Node.js](https://github.com/webcoder31/ezxmldsig-js#trust-anchor).
</div>

<div class="callout" markdown="1">
**Revocation is not checked.** The libraries consult neither certificate revocation lists (CRL) nor OCSP responders: a revoked certificate is accepted until it expires.

To stop trusting a compromised CA, remove it from `caCertPath`. To stop trusting a compromised signing certificate, remove its issuing CA as well, or pin the certificate that replaces it with `signerCertPath`.
</div>

## Beyond single sign-on

Single sign-on is the most telling use, not the only one: the same tokens carry any data whose origin the receiver must be sure of, between applications or organizations.

## Why these libraries?

None of this is new. What ezxmldsig adds is simplicity: a few lines to create a signed login token, encrypted if need be, and a few lines to check it, its chain of certification included. The author found no library doing so, in PHP or in Node.js, and wrote two. They follow the W3C standards XML Signature and XML Encryption and read each other's tokens, so that a single sign-on can span applications written in PHP and in Node.js.

</article>
