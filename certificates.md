---
layout: default
title: Certificates and keys
description: "The certificates a token needs, who holds which key, what is checked, the fields of a subject, and how to create them with OpenSSL."
---
<article class="prose" markdown="1">

# Certificates and keys

{: .lead}
A token involves up to three kinds of certificates, all X.509 certificates in PEM format with **RSA keys**: the signature algorithms are RSA ones and the session key is encrypted with RSA-OAEP, so EC and DSA keys are refused.

## Who holds what

| Certificate | Who holds the private key | Who needs the certificate | Required |
|---|---|---|---|
| Signing certificate | The sender, to sign | The sender (it is copied into each token); the receiver when it pins it (`signerCertPath`) | Always |
| CA certificates | The CA that issues the signing certificate | The receiver (`caCertPath`) | Unless the signing certificate is pinned |
| Encryption certificate | The receiver, to decrypt | The sender, to encrypt | For encrypted tokens only |

## What is checked

The signing certificate must be valid at the current date and, if it has a key usage extension, allow `digitalSignature` or `nonRepudiation`. With `caCertPath`, every certificate of the chain is also checked: validity dates, signature, and, for each issuer, basic constraints with `CA:TRUE` and a key usage that allows `keyCertSign`. Revocation is not checked (see [Why?]({{ '/why/' | relative_url }})).

The encryption certificate is not checked: give it a key usage that allows `keyEncipherment` all the same. Use keys of 2048 bits at least; the libraries do not enforce a size.

## The fields of the subject

The subject of a certificate is a Distinguished Name made of fields. The libraries require none of them, but the receiver can only tell the expected sender from the other holders of certificates of the same CA by these fields, with `expectedSubject`:

| Field | Name | Usual content |
|---|---|---|
| `C` | Country | Two-letter country code (`DK`) |
| `ST` | State or province | Region (`Jylland`) |
| `L` | Locality | City (`Kattegat`) |
| `O` | Organization | Legal name of the organization (`Lothbrok Ltd`) |
| `OU` | Organizational unit | Department or service within the organization (`Signature Dept`) |
| `CN` | Common name | Name of the certificate holder: a person, a service or a host name (`www.lothbrok.dk`) |
| `emailAddress` | Email address | Contact address (`ivar@lothbrok.dk`) |

`O` and `OU` are the fields the receiver usually checks: requiring `O` = `Lothbrok Ltd` and `OU` = `Signature Dept` accepts the certificates of this department of this organization, and those only. Give each sender a subject that sets it apart from the other holders of certificates of the same CA (a distinct `OU` or `CN`), and use the same values, character case included, in the certificate and in `expectedSubject`.

## Creating them with OpenSSL

The commands below create a root CA, an intermediate CA issued by the root, a signing certificate and an encryption certificate issued by the intermediate CA, valid for 2 years. Adapt the subjects and the durations, and keep the private keys out of any repository. The extensions go into a file, here `ext.cnf`:

```ini
[root]
basicConstraints = critical, CA:TRUE
keyUsage = critical, keyCertSign, cRLSign
subjectKeyIdentifier = hash

[intermediate]
basicConstraints = critical, CA:TRUE, pathlen:0
keyUsage = critical, keyCertSign, cRLSign
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid

[sign]
basicConstraints = CA:FALSE
keyUsage = critical, digitalSignature, nonRepudiation
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid

[crypt]
basicConstraints = CA:FALSE
keyUsage = critical, keyEncipherment, dataEncipherment
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid
```

```sh
# Root CA: a self-signed certificate.
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -out root.key.pem
openssl req -new -x509 -sha256 -days 730 -key root.key.pem \
    -subj "/C=DK/O=Lothbrok Ltd/CN=Lothbrok Root CA" \
    -config ext.cnf -extensions root -out root.cert.pem

# Intermediate CA, issued by the root.
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -out intermediate.key.pem
openssl req -new -key intermediate.key.pem \
    -subj "/C=DK/O=Lothbrok Ltd/CN=Lothbrok Intermediate CA" -out intermediate.csr
openssl x509 -req -in intermediate.csr -sha256 -days 730 \
    -CA root.cert.pem -CAkey root.key.pem -CAcreateserial \
    -extfile ext.cnf -extensions intermediate -out intermediate.cert.pem

# Signing certificate of the sender, with a key protected by a password.
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 \
    -aes-256-cbc -pass pass:signKeyPassword -out sign.key.pem
openssl req -new -key sign.key.pem -passin pass:signKeyPassword \
    -subj "/C=DK/O=Lothbrok Ltd/OU=Signature Dept/CN=www.lothbrok.dk" -out sign.csr
openssl x509 -req -in sign.csr -sha256 -days 730 \
    -CA intermediate.cert.pem -CAkey intermediate.key.pem -CAcreateserial \
    -extfile ext.cnf -extensions sign -out sign.cert.pem

# Encryption certificate of the recipient.
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 \
    -aes-256-cbc -pass pass:cryptKeyPassword -out crypt.key.pem
openssl req -new -key crypt.key.pem -passin pass:cryptKeyPassword \
    -subj "/C=DK/O=Lothbrok Ltd/OU=Cryptography Dept/CN=www.lothbrok.dk" -out crypt.csr
openssl x509 -req -in crypt.csr -sha256 -days 730 \
    -CA intermediate.cert.pem -CAkey intermediate.key.pem -CAcreateserial \
    -extfile ext.cnf -extensions crypt -out crypt.cert.pem

# Check the chains.
openssl verify -CAfile root.cert.pem -untrusted intermediate.cert.pem sign.cert.pem crypt.cert.pem
```

The receiver then trusts the sender with `intermediate.cert.pem` and `root.cert.pem` in `caCertPath`, and `O` = `Lothbrok Ltd`, `OU` = `Signature Dept` in `expectedSubject`. Without a CA, a self-signed signing certificate pinned by the receiver (`signerCertPath`) is enough: create it like the root above, with the extensions of `[sign]`.

## When a key is compromised

The libraries do not check revocation (see [Why?]({{ '/why/' | relative_url }})): a certificate whose key has leaked stays valid for them until it expires. The receiver stops trusting it with the trust options, in a way that depends on the key that leaked.

**The signing key of the sender.** Whoever holds it can create tokens the receiver accepts, until the certificate expires.

1. The sender creates a new key pair, has its CA issue a new signing certificate, and signs with it from then on.
2. The receiver pins this new certificate with `signerCertPath`, and keeps `caCertPath`: both are then required, and a token signed with the old certificate is rejected, although its CA is still trusted.
3. Once the old certificate has expired, the receiver may remove `signerCertPath`: an expired certificate is rejected anyway.

`expectedSubject` does not help here: the new certificate usually has the same subject as the old one, which the holder of the leaked key keeps using. And `signerCertPath` names a single certificate, so that the old and the new one are never accepted together: the sender and the receiver switch at the same time, and the tokens created just before the switch are rejected.

**The key of a CA, intermediate or root.** Whoever holds it can issue certificates with any subject: neither `expectedSubject` nor a CA in `caCertPath` protects any longer.

1. The receiver removes this CA from `caCertPath`.
2. The sender gets a signing certificate from a sound CA: a new intermediate, or a new root if the root has leaked.
3. The receiver adds the new CA to `caCertPath`. Meanwhile, it can pin the new certificate of the sender with `signerCertPath` alone, which is then the trust anchor.

**The decryption key of the recipient**, for encrypted tokens. Whoever holds it reads the tokens it intercepts.

1. The recipient creates a new encryption key pair and gives its new certificate to the sender, which encrypts with it from then on.
2. The tokens already intercepted stay readable, and nothing can change that: an encrypted token should not carry data whose late disclosure would be a problem.

<div class="see-also" markdown="1">
The trust anchor in code, with the forms `expectedSubject` takes: the section "Trust anchor" of the README, [in PHP](https://github.com/webcoder31/ezxmldsig-php#trust-anchor) · [in Node.js](https://github.com/webcoder31/ezxmldsig-js#trust-anchor).
</div>

</article>
