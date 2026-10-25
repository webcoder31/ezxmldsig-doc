---
layout: default
title: Interoperability
description: "The two libraries read each other's tokens; the format of a token, and how other XML Signature libraries create and read one."
---
<article class="prose" markdown="1">

# Interoperability

{: .lead}
A token is an XML digital signature and, when encrypted, XML Encryption: two W3C standards. The two ezxmldsig libraries read each other's tokens, and other libraries can create or read them, provided they follow the format below and make the checks ezxmldsig makes.

## PHP and Node.js

A token created by either library is valid for the other, signed or encrypted, with every algorithm and option both share. The tests of the Node.js library check it against the PHP library under PHP 7.4 and 8.3, and replay the attack lab of the [token lab](https://ezxmldsig.wbcdr.dev): every forged token gets the same verdict from both, with the same error.

The few cases where they differ are listed in the README of the Node.js library, in the section [Differences with the PHP library](https://github.com/webcoder31/ezxmldsig-js#differences-with-the-php-library).

## The format of a token

An enveloping signature: `ds:Signature` is the document element, and its `ds:Object Id="Token"` holds the node `Token`, referenced by `URI="#Token"`. Inclusive canonicalization (http://www.w3.org/TR/2001/REC-xml-c14n-20010315) for `ds:SignedInfo` and as the only transform, RSA-SHA256 and an SHA-256 digest by default, and the signing certificate in `ds:KeyInfo/ds:X509Data/ds:X509Certificate`. The node `Token` holds, in this order:

* `TokenTimestamp`: the date of creation, in UTC, as `2026-10-21T18:30:07Z`;
* `TokenId`: 16 random bytes, in 32 lowercase hexadecimal characters;
* `TokenExpiry` (optional): the date after which the token is out of date, in the same format;
* `TokenAudience` (optional): one node per audience;
* `TokenData`: the data, a node per key, nested for nested arrays, each value encoded in Base64 and marked `Algorithm="base64"`.

Encrypted, the node `Token` is replaced by an `xenc:EncryptedData` of type http://www.w3.org/2001/04/xmlenc#Element (`Content` is read as well), encrypted with AES-256-GCM, its session key encrypted with RSA-OAEP (http://www.w3.org/2001/04/xmlenc#rsa-oaep-mgf1p) and held in its `ds:KeyInfo`.

The page [How does it work?]({{ '/how-it-works/' | relative_url }}) shows a whole token.

## With other libraries

Checked with [xml-crypto](https://www.npmjs.com/package/xml-crypto) 6.4.0 and [xml-encryption](https://www.npmjs.com/package/xml-encryption) 6.0.2 for Node.js, both ways: their tokens are analyzed by ezxmldsig, and they read the tokens of ezxmldsig. The tests of the Node.js library create and read tokens with them the way the two examples below do.

In Node.js, prefer the Node.js library itself, which makes every check: these examples are for a sender or a receiver that cannot use it.

### Creating a token with xml-crypto

xml-crypto places a signature inside an existing document: sign in a throwaway root, then keep the signature alone, as the document element.

```js
import fs from 'node:fs';
import crypto from 'node:crypto';
import { SignedXml } from 'xml-crypto';
import xmlenc from 'xml-encryption';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

const C14N = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
const date = (d) => d.toISOString().replace(/\.\d{3}Z$/, 'Z');
const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');

const now = new Date();
let token = '<Token>'
  + '<TokenTimestamp>' + date(now) + '</TokenTimestamp>'
  + '<TokenId>' + crypto.randomBytes(16).toString('hex') + '</TokenId>'
  + '<TokenExpiry>' + date(new Date(now.getTime() + 300e3)) + '</TokenExpiry>'
  + '<TokenAudience>receiver</TokenAudience>'
  + '<TokenData><name Algorithm="base64">' + b64('Ragnar Lothbrok') + '</name></TokenData>'
  + '</Token>';

// Optional: encrypt it for the recipient.
token = await new Promise((resolve, reject) => xmlenc.encrypt(token, {
  rsa_pub: fs.readFileSync('crypt.cert.pem'),
  pem: fs.readFileSync('crypt.cert.pem'),
  encryptionAlgorithm: 'http://www.w3.org/2009/xmlenc11#aes256-gcm',
  keyEncryptionAlgorithm: 'http://www.w3.org/2001/04/xmlenc#rsa-oaep-mgf1p',
}, (err, result) => err ? reject(err) : resolve(result)));

const sig = new SignedXml({
  privateKey: fs.readFileSync('sign.key.pem'), // without password
  publicCert: fs.readFileSync('sign.cert.pem'),
  canonicalizationAlgorithm: C14N,
  signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
  objects: [{ content: token, attributes: { Id: 'Token' } }],
});
sig.addReference({
  xpath: "//*[@Id='Token']",
  digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
  transforms: [C14N],
});
sig.computeSignature('<root/>', { prefix: 'ds' });

const doc = new DOMParser().parseFromString(sig.getSignedXml(), 'text/xml');
const xml = '<?xml version="1.0"?>\n' + new XMLSerializer().serializeToString(doc.documentElement.firstChild);
```

Either library then analyzes it as any of its tokens.

### Reading a token with xml-crypto

xml-crypto only verifies the signature, with the key it is given, and xml-encryption only decrypts. Read the data from the content the signature covers, never from the document received, or a forged `Token` placed elsewhere in it would be read (signature wrapping):

```js
import fs from 'node:fs';
import { SignedXml } from 'xml-crypto';
import xmlenc from 'xml-encryption';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

// The first child element of a node: whitespace may come before it.
const firstElement = (node) => {
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (child.nodeType === 1) return child;
  }
  return null;
};

const doc = new DOMParser().parseFromString(xml, 'text/xml');
const sig = new SignedXml({ publicCert: fs.readFileSync('sign.cert.pem') });
sig.loadSignature(doc.documentElement);
if (!sig.checkSignature(xml)) {
  throw new Error('Invalid signature');
}
const [signed] = sig.getSignedReferences(); // the canonical ds:Object
let content = firstElement(new DOMParser().parseFromString(signed, 'text/xml').documentElement);

// An encrypted token: decrypt the xenc:EncryptedData the signature covers.
if (content.localName === 'EncryptedData') {
  const plain = await new Promise((resolve, reject) => xmlenc.decrypt(
    new XMLSerializer().serializeToString(content),
    { key: fs.readFileSync('crypt.key.pem') }, // without password
    (err, result) => err ? reject(err) : resolve(result)));
  content = new DOMParser().parseFromString(plain, 'text/xml').documentElement;
}
// content is the node Token.
```

<div class="callout" markdown="1">
**The rest is left to the receiver**, which `isSignatureValid()` does with ezxmldsig. Refuse a document type declaration; check the algorithms; trust the signing certificate (its chain up to your CA, its validity, its subject), not only the key it holds; check the structure of `Token`, the format of `TokenTimestamp` and `TokenId`, and the audience against its own; then, as with ezxmldsig, the time to live, the expiry and the replay of the identifier. See [The receiver's duties]({{ '/receiver/' | relative_url }}).
</div>

</article>
