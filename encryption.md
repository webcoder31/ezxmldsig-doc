---
layout: default
title: Encryption
description: "What the encryption of a token protects and what it does not, its default algorithms, and the attacks its choices stop."
---
<article class="prose" markdown="1">

# Encryption

{: .lead}
The data of a token can be encrypted for its receiver, so that only the receiver can read them, even when the token travels over an unencrypted connection. The signature still proves who issued the token: encryption protects the confidentiality of the data, not their origin.

## How it works

The data are encrypted with a **session key**, generated for each token. The session key is encrypted for the receiver with the public key of its **encryption certificate**: only the private key of the receiver can recover it (key transport). The node `Token` is then replaced by an `xenc:EncryptedData` node, as XML Encryption defines it.

The encryption takes place **before** the signature, which therefore covers the encrypted data: altering them invalidates the token.

The sender needs the encryption certificate of the receiver, never its private key.

## What it does not protect

Only the data of the token are encrypted. Encryption protects neither the rest of the request that carries the token nor the response, does not authenticate the server the token is sent to, and does not prevent an intercepted token from being submitted again (see [The receiver's duties]({{ '/receiver/' | relative_url }})). Use an HTTPS connection all the same.

## Default algorithms

* The data are encrypted with **AES-256-GCM**. AES-GCM checks an authentication tag before returning any data: altered data are rejected as a whole.
* The session key is encrypted with **RSA-OAEP** (http://www.w3.org/2001/04/xmlenc#rsa-oaep-mgf1p).

## Choices that stop known attacks

**Decryption after verification.** A token is only decrypted once its digest, its signature, the trust in its certificate and its algorithms have been verified. A token that fails one of these checks is never decrypted: an attacker cannot submit forged encrypted data to the decryption.

**One error for every decryption failure.** Whatever fails once the decryption starts (session key, data, parsing of the decrypted XML), the analysis returns the same error, `Token decryption failed!`, with no reason. A distinct message per failure would let someone who can submit altered tokens tell which step failed, which is what padding oracle attacks need. Failures that do not depend on the encrypted content keep their own message: no decryption key, a key that cannot be loaded, a malformed `xenc:EncryptedData`.

**RSA 1.5 is refused**, at creation and at analysis, and no option allows it. With the key transport algorithm http://www.w3.org/2001/04/xmlenc#rsa-1_5 (PKCS #1 v1.5 padding), whether the padding of a submitted session key is valid can be told from its decryption (Bleichenbacher's attack).

**CBC is accepted only when declared.** AES-CBC and Triple DES CBC have no integrity: altered data are decrypted all the same, and how the decrypted content fails can tell what the data hold (Jager and Somorovsky's attack on XML Encryption). Only the signature protects them, so that the decryption is the only obstacle left to a signer the receiver trusts who can submit altered tokens. An analysis decrypts a CBC token only if the receiver names this very algorithm. Declare it only to read the tokens of peers that cannot use AES-GCM yet.

<div class="see-also" markdown="1">
Creating and reading encrypted tokens, and their options: the section "Encryption" of the README, [in PHP](https://github.com/webcoder31/ezxmldsig-php#encryption) · [in Node.js](https://github.com/webcoder31/ezxmldsig-js#encryption).
</div>

</article>
