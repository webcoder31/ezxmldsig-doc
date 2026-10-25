---
layout: default
title: Single sign-on
description: "How signed tokens give a single sign-on: who signs, who checks, what goes through the browser, and what each party must protect."
---
<article class="prose" markdown="1">

# Single sign-on

{: .lead}
One login on an identity provider opens every application that trusts it. The identity provider alone knows the passwords; it signs a token for each application the user enters, and each application checks the token before opening a session of its own.

<figure class="figure" aria-label="A single sign-on, animated">
{% include sso-art.html %}
</figure>

## The three sites

The single sign-on demo plays it with three sites on three host names:

* **IDP**, the identity provider, which alone knows the users and their passwords, and signs the tokens;
* **MAIL** and **CRM**, two applications, which have no password and trust the tokens of IDP.

<p class="actions"><a class="btn-primary" href="https://sso.wbcdr.dev">Try the SSO demo</a></p>

## Trust, set up beforehand

No site calls another: every request and every token goes through the browser of the user. What links the sites is set up beforehand, through certificates:

* each application trusts the certificate IDP signs with, by its CA (`caCertPath`) and, to tell IDP from the other holders of certificates of this CA, by its subject (`expectedSubject`) or by the certificate itself (`signerCertPath`);
* IDP knows each application: the address its tokens must be posted to, and, when it encrypts them, the certificate of the application.

These are the dashed links of the illustration: they carry nothing at run time.

## The flow

1. The user opens MAIL. MAIL has no session for them, so it sends the browser to IDP, with its request.
2. The user logs in on IDP. IDP opens its own session, signs a token addressed to MAIL (its audience), valid a short time (60 seconds in the demo), and returns a page that posts it to MAIL, in a form, as the HTTP-POST binding of SAML does.
3. MAIL verifies the token, then opens its own session.
4. The user opens CRM, which sends the browser to IDP in turn. IDP recognizes the user by its own session cookie, and signs a token for CRM without asking for the password again. That is single sign-on.

## What each application checks

* **Through the library**, with `isSignatureValid()`: the structure of the token, its algorithms, its digest, its signature, the trust in the certificate of IDP, and that the token is addressed to this application (see [How does it work?]({{ '/how-it-works/' | relative_url }})).
* **Itself**: the freshness of the token, its expiry, and that it was not accepted before (see [The receiver's duties]({{ '/receiver/' | relative_url }})).

Only then does it read the data of the token and open its own session.

## Who decides what

* **Access to an application** is decided by IDP, which signs no token for an application the user may not enter.
* **What the user may do in an application** is decided by the application, from an attribute IDP writes in the token, such as a role.

An attribute stays as it is until the token expires, and so does the session the application opened with it: a right withdrawn in IDP only takes effect with the next token.

## What each party must protect

The library stops a tampered token, a token signed by another identity provider, and an encrypted token presented to an application other than its own. Four attacks are left to the code of the sites:

| Attack | Stopped by |
|---|---|
| A token signed for one application, presented to another | The audience, checked by the library when the token names one: IDP must name it |
| A token presented again | The replay memory of the application |
| An old token | The freshness and the expiry, checked by the application |
| A token sent to an address an attacker chose | IDP, which posts each token only to the address registered for its application |

The attack lab of the demo runs each of them, with the protection on and off.

<div class="callout" markdown="1">
**For a single sign-on in production, prefer a standard, OpenID Connect or SAML, with a maintained library.** The demo shows the mechanisms, and what a receiver must check. Logging out of every site at once (single logout) is a mechanism of its own, which it does not implement.
</div>

</article>
