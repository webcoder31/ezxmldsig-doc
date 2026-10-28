---
layout: default
title: The receiver's duties
description: "What the analysis of a token does not check, and the receiver must: the trust anchor restricted to the sender, freshness, expiry, replay, audience."
---
<article class="prose" markdown="1">

# The receiver's duties

{: .lead}
`isSignatureValid()` tells whether a token is authentic and addressed to its receiver. It does not tell whether the token is fresh, or whether it was accepted before: **a token that was valid once stays valid for it, however old it is and however many times it is submitted.**

Before trusting the data of a received token, the receiver makes three checks:

1. `isSignatureValid()` returns true: structure, algorithms, digest, signature, trust in the signing certificate, and audience when the token names one;
2. `isOutOfDate()` returns false, for the time to live the application accepts, and the expiry of the token if it has one (freshness);
3. the identifier of the token has not been accepted before (replay).

<div class="see-also" markdown="1">
The code of these three checks: the section "Checking an XML token" of the README, [in PHP](https://github.com/webcoder31/ezxmldsig-php#checking-an-xml-token) · [in Node.js](https://github.com/webcoder31/ezxmldsig-js#checking-an-xml-token).
</div>

## Restrict the trust anchor to the sender

`caCertPath` accepts any certificate its CA issues. As soon as this CA also issues certificates to others than the expected sender (a public CA, or a company CA that issues one per server or per partner), any of them can sign a token that `isSignatureValid()` accepts.

Add `expectedSubject`, the subject of the certificate of the sender, or pin the certificate of the sender with `signerCertPath`. The page [Certificates and keys]({{ '/certificates/' | relative_url }}) tells how to give each sender a subject of its own.

## Freshness and expiry

A token holds the date it was signed (`TokenTimestamp`). The receiver chooses how long it accepts a token after this date, its **time to live**: `isOutOfDate(ttl)` accepts a token from 30 seconds (`DESYNC_TOLERANCE`) before its timestamp, for clocks slightly out of step, to `ttl` seconds after it.

The issuer can also set a **validity**: the option `validity`, in seconds, writes in the token the date after which it is out of date (`TokenExpiry`). `isOutOfDate()` then rejects the token once this date is passed, whatever the time to live: the shorter of the two applies.

Choose a short time to live: the time the token needs to go from the issuer to the receiver, through the browser in a single sign-on. A minute is plenty.

## Replay

A valid token can be submitted again, by whoever intercepted it, for as long as `isOutOfDate()` accepts it. **The libraries keep no list of the tokens they have analyzed**: refusing a token already accepted is up to the receiver.

Each token holds an identifier of 128 random bits, in hexadecimal, covered by the signature (`TokenId`): altering it invalidates the token. The receiver must:

* store the identifier of each token it accepts, **atomically** with the check that it is not stored yet (a unique key in a database, `SET NX` in Redis…), in a store shared by all the servers that receive the tokens;
* refuse a token whose identifier is already stored;
* keep each identifier at least as long as the token can be accepted: `ttl + DESYNC_TOLERANCE` seconds after accepting it. The expiry of a token can only shorten this time.

A check made in two steps, "is it stored?" then "store it", lets two copies of the same token pass if they arrive together. A store of its own on each server lets a token pass once per server.

A token without identifier is rejected, as is one whose identifier is not 32 lowercase hexadecimal characters: the receiver could not tell it from a replayed one.

## Audience

A token signed by a trusted issuer is valid for **every** receiver that trusts this issuer: in a single sign-on, a token issued for one application would open another one, unless the token says who it is addressed to.

The issuer names the receivers with the option `audience` (a string, or a list of strings): application names, URLs, any value the issuer and each receiver agree on. Each receiver gives its own with `expectedAudience`, and `isSignatureValid()` checks it:

| Token | `expectedAudience` given | `expectedAudience` not given |
|---|---|---|
| Names audiences | Valid only if one of them is `expectedAudience` (compared as is, case included) | **Rejected**: a receiver that does not say who it is cannot accept a token addressed to someone |
| Names no audience | **Rejected**: the receiver asked for a token addressed to it | Valid |

Audience and validity are covered by the signature: nobody can change them without invalidating the token.

<div class="see-also" markdown="1">
The options and their checks: the sections "Replay" and "Audience and expiry" of the README, in PHP ([Replay](https://github.com/webcoder31/ezxmldsig-php#replay), [Audience and expiry](https://github.com/webcoder31/ezxmldsig-php#audience-and-expiry)) · in Node.js ([Replay](https://github.com/webcoder31/ezxmldsig-js#replay), [Audience and expiry](https://github.com/webcoder31/ezxmldsig-js#audience-and-expiry)).
</div>

## In short

| Check | Made by | What it prevents |
|---|---|---|
| Trust in the certificate, restricted to the sender | The library, with the trust anchor the receiver gives | A token signed by another holder of a certificate of the same CA |
| Audience | The library, with `expectedAudience` | A token for one receiver presented to another |
| Freshness and expiry | The receiver, with `isOutOfDate()` | An old token |
| Replay | The receiver, with its store of identifiers | A token presented again |

</article>
